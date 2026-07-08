const { Chess } = require('chess.js');
const { ROOM_STATUS, GAME_CONFIG } = require('../utils/constants');

function clone(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return JSON.parse(JSON.stringify(value));
}

function createRoom(roomId, ownerId = null) {
  return {
    id: roomId,
    ownerId,
    chess: new Chess(),
    players: { white: null, black: null },
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    status: ROOM_STATUS.WAITING,
    result: null,
    timers: {
      white: GAME_CONFIG.INITIAL_TIME_SECONDS,
      black: GAME_CONFIG.INITIAL_TIME_SECONDS,
    },
    timerInterval: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createRoomFromSnapshot(snapshot) {
  const room = createRoom(snapshot.id, snapshot.ownerId || null);

  return {
    ...room,
    players: clone(snapshot.players, room.players),
    status: snapshot.status || room.status,
    result: snapshot.result || null,
    moveHistory: clone(Array.isArray(snapshot.moveHistory) ? snapshot.moveHistory : [], []),
    capturedPieces: clone(snapshot.capturedPieces, room.capturedPieces),
    timers: clone(snapshot.timers, room.timers),
    createdAt: snapshot.createdAt ? new Date(snapshot.createdAt) : room.createdAt,
    updatedAt: snapshot.updatedAt ? new Date(snapshot.updatedAt) : room.updatedAt,
  };
}

module.exports = {
  createRoom,
  createRoomFromSnapshot,
};
