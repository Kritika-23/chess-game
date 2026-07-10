const roomManager = require('./room.manager');
const chessService = require('../../chess/ChessService');
const { createPlayer } = require('../../models/Player');
const { generateRoomCode } = require('../../utils/roomCode');
const { AppError } = require('../../utils/errors');
const { ROOM_STATUS, GAME_CONFIG } = require('../../utils/constants');
const logger = require('../../utils/logger');
const { getCollection, saveDatabase } = require('../../config/database');
const userRepository = require('../auth/user.repository');

const DEFAULT_RATING = 1200;
const ELO_K_FACTOR = 32;

function expectedScore(playerRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function getResultScore(result, color) {
  if (!result.winner) return 0.5;
  return result.winner === color ? 1 : 0;
}

function calculateEloRating(currentRating, opponentRating, actualScore) {
  const rating = Number.isFinite(currentRating) ? currentRating : DEFAULT_RATING;
  const opponent = Number.isFinite(opponentRating) ? opponentRating : DEFAULT_RATING;
  return Math.max(100, Math.round(rating + ELO_K_FACTOR * (actualScore - expectedScore(rating, opponent))));
}

class GameService {
  constructor() {
    this.publisher = {
      timerUpdate: () => {},
      gameOver: () => {},
    };
  }

  configurePublisher(publisher) {
    this.publisher = {
      ...this.publisher,
      ...publisher,
    };
  }

  createRoom({ userId = null } = {}) {
    const roomId = generateRoomCode();
    const room = roomManager.create(roomId, userId);
    this.persistRoom(room);
    logger.info(`[rooms] createRoom returned ${roomId} for user=${userId || 'guest'}`);
    return { roomId };
  }

  getRoomSummary(roomId) {
    const room = roomManager.get(roomId);
    if (!room) {
      logger.warn(`[rooms] getRoomSummary failed for ${roomId}`);
      throw new AppError('Room not found', 404);
    }

    logger.info(`[rooms] getRoomSummary found ${room.id} status=${room.status} players=${roomManager.countPlayers(room)}`);
    return {
      exists: true,
      roomId: room.id,
      status: room.status,
      playerCount: roomManager.countPlayers(room),
    };
  }

  joinRoom({ roomId, playerName, socketId, user = null }) {
    if (!roomId) {
      throw new AppError('Room code is required');
    }

    const id = roomId.toUpperCase();
    const room = roomManager.get(id);
    if (!room) {
      logger.warn(`[rooms] joinRoom failed for ${id}; room does not exist`);
      throw new AppError('Room not found', 404);
    }

    const assignedColor = this.assignColor(room, socketId);

    const player = createPlayer({
      socketId,
      userId: user?.id || null,
      name: user?.name || playerName,
      color: assignedColor,
      isGuest: !user,
    });

    room.players[assignedColor] = player;

    if (room.players.white && room.players.black && room.status === ROOM_STATUS.WAITING) {
      room.status = ROOM_STATUS.ACTIVE;
      this.startRoomTimer(room);
    }

    this.persistRoom(room);
    logger.info(`[rooms] ${player.name || 'guest'} joined ${id} as ${assignedColor}; status=${room.status}`);

    return {
      room,
      roomId: id,
      color: assignedColor,
      state: chessService.getPublicState(room),
    };
  }

  assignColor(room, socketId) {
    if (room.players.white?.socketId === socketId) return 'white';
    if (room.players.black?.socketId === socketId) return 'black';
    if (!room.players.white) return 'white';

    if (!room.players.black) {
      if (room.players.white.socketId === socketId) return 'white';
      if (room.status === ROOM_STATUS.WAITING || room.status !== ROOM_STATUS.WAITING) return 'black';
    }

    throw new AppError('Room is full. Cannot join.');
  }

  makeMove({ roomId, color, from, to, promotion }) {
    const room = roomManager.get(roomId);
    const result = chessService.makeMove({ room, color, from, to, promotion });

    if (result.event === 'gameOver') {
      this.recordGameResult(room);
      this.persistRoom(room);
    }

    return result;
  }

  resign({ roomId, color }) {
    const room = roomManager.get(roomId);
    const result = chessService.resign(room, color);
    if (result) {
      this.recordGameResult(room);
      this.persistRoom(room);
    }
    return result;
  }

  acceptRestart({ roomId, updateSocketColor }) {
    const room = roomManager.get(roomId);
    if (!room) return null;

    const previousWhite = room.players.white;
    const previousBlack = room.players.black;

    chessService.resetForRestart(room);

    if (previousWhite && previousBlack) {
      room.players.white = { ...previousBlack, color: 'white' };
      room.players.black = { ...previousWhite, color: 'black' };
      updateSocketColor(room.players.white.socketId, 'white');
      updateSocketColor(room.players.black.socketId, 'black');
    }

    this.startRoomTimer(room);
    this.persistRoom(room);
    return { state: chessService.getPublicState(room) };
  }

  markDisconnected({ roomId, color }) {
    const room = roomManager.get(roomId);
    if (!room || !color || !room.players[color]) return null;

    room.players[color].connected = false;
    this.persistRoom(room);
    logger.info(`${color} left room ${roomId}`);

    if (room.status === ROOM_STATUS.ACTIVE) {
      chessService.stopTimer(room);
    }

    return { room, color };
  }

  scheduleCleanup(roomId) {
    setTimeout(() => {
      const room = roomManager.get(roomId);
      if (!room) return;

      const bothGone = !room.players.white?.connected && !room.players.black?.connected;
      if (bothGone) {
        chessService.stopTimer(room);
        roomManager.delete(roomId);
        this.deletePersistedRoom(roomId);
        logger.info(`Room ${roomId} deleted`);
      }
    }, GAME_CONFIG.ROOM_CLEANUP_DELAY_MS);
  }

  reconnect({ roomId, playerName, color, socketId }) {
    const id = roomId.toUpperCase();
    const room = roomManager.get(id);
    if (!room) {
      throw new AppError('Room no longer exists', 404);
    }

    const player = room.players[color];
    if (!player || player.name !== playerName) {
      throw new AppError('Cannot reconnect: player info mismatch');
    }

    player.socketId = socketId;
    player.connected = true;

    const bothConnected = room.players.white?.connected && room.players.black?.connected;
    if (bothConnected && room.status === ROOM_STATUS.ACTIVE) {
      this.startRoomTimer(room);
    }

    this.persistRoom(room);
    logger.info(`[rooms] ${playerName} reconnected to ${id} as ${color}`);

    return {
      roomId: id,
      color,
      state: chessService.getPublicState(room),
    };
  }

  startRoomTimer(room) {
    chessService.startTimer(room, {
      onTick: (updatedRoom) => {
        this.publisher.timerUpdate(updatedRoom.id, { timers: updatedRoom.timers });
      },
      onTimeout: (updatedRoom, winner) => {
        updatedRoom.status = ROOM_STATUS.FINISHED;
        updatedRoom.result = { winner, reason: 'timeout' };
        this.recordGameResult(updatedRoom);
        this.persistRoom(updatedRoom);
        this.publisher.gameOver(updatedRoom.id, {
          result: updatedRoom.result,
          state: chessService.getPublicState(updatedRoom),
        });
      },
    });
  }

  persistRoom(room) {
    const rooms = getCollection('rooms');
    const snapshot = {
      id: room.id,
      ownerId: room.ownerId,
      players: room.players,
      status: room.status,
      result: room.result,
      moveHistory: room.moveHistory,
      capturedPieces: room.capturedPieces,
      timers: room.timers,
      createdAt: room.createdAt,
      updatedAt: new Date().toISOString(),
    };

    const existingIndex = rooms.findIndex((item) => item.id === room.id);
    if (existingIndex >= 0) {
      rooms[existingIndex] = { ...rooms[existingIndex], ...snapshot };
    } else {
      rooms.push(snapshot);
    }

    saveDatabase();
    logger.info(`[rooms] persisted ${room.id}; persisted rooms=${rooms.map((item) => item.id).join(',') || 'none'}`);
  }

  hydrateRooms() {
    const rooms = getCollection('rooms');
    roomManager.hydrate(rooms);
  }

  deletePersistedRoom(roomId) {
    const normalizedRoomId = roomId.toUpperCase();
    const rooms = getCollection('rooms');
    const existingIndex = rooms.findIndex((item) => item.id?.toUpperCase() === normalizedRoomId);

    if (existingIndex >= 0) {
      rooms.splice(existingIndex, 1);
      saveDatabase();
      logger.info(`[rooms] removed ${normalizedRoomId} from persisted rooms`);
    }
  }

  recordGameResult(room) {
    if (!room || !room.result || room.statsRecorded) return;

    const playerEntries = [room.players.white, room.players.black]
      .filter((player) => player?.userId)
      .map((player) => ({
        player,
        user: userRepository.findById(player.userId),
      }))
      .filter((entry) => entry.user);

    const ratingUpdates = this.calculateRatingUpdates(playerEntries, room.result);

    playerEntries.forEach(({ player, user }) => {
      const stats = { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, ...(user.stats || {}) };
      stats.gamesPlayed += 1;

      if (!room.result.winner) {
        stats.draws += 1;
      } else if (room.result.winner === player.color) {
        stats.wins += 1;
      } else {
        stats.losses += 1;
      }

      const updates = { stats };
      if (ratingUpdates.has(user.id)) {
        updates.rating = ratingUpdates.get(user.id);
      }

      userRepository.update(user.id, updates);
    });

    const statistics = getCollection('statistics');
    statistics.push({
      roomId: room.id,
      result: room.result,
      players: {
        whiteUserId: room.players.white?.userId || null,
        blackUserId: room.players.black?.userId || null,
      },
      recordedAt: new Date().toISOString(),
    });

    room.statsRecorded = true;
    saveDatabase();
  }

  calculateRatingUpdates(playerEntries, result) {
    const ratingUpdates = new Map();
    if (playerEntries.length !== 2) return ratingUpdates;

    const [firstEntry, secondEntry] = playerEntries;
    const firstRating = firstEntry.user.rating || DEFAULT_RATING;
    const secondRating = secondEntry.user.rating || DEFAULT_RATING;

    ratingUpdates.set(
      firstEntry.user.id,
      calculateEloRating(firstRating, secondRating, getResultScore(result, firstEntry.player.color))
    );
    ratingUpdates.set(
      secondEntry.user.id,
      calculateEloRating(secondRating, firstRating, getResultScore(result, secondEntry.player.color))
    );

    return ratingUpdates;
  }
}

module.exports = new GameService();
