const gameService = require('../modules/game/game.service');
const events = require('./socketEvents');
const logger = require('../utils/logger');
const { canUseGuestMode } = require('./socketAuth');

function emitSocketError(socket, error) {
  socket.emit(events.ERROR, { message: error.message || 'Unexpected server error' });
}

function registerGameSocket(io, socket) {
  logger.info(`Socket connected ${socket.id}`);

  socket.on(events.JOIN_ROOM, (payload = {}) => {
    try {
      logger.info(`[socket] joinRoom requested socket=${socket.id} room=${payload.roomId || 'missing'} player=${payload.playerName || 'guest'}`);
      if (!socket.data.user && !canUseGuestMode()) {
        socket.emit(events.ERROR, { message: 'Authentication required' });
        return;
      }

      const result = gameService.joinRoom({
        roomId: payload.roomId,
        playerName: payload.playerName,
        socketId: socket.id,
        user: socket.data.user,
      });

      socket.join(result.roomId);
      socket.data.roomId = result.roomId;
      socket.data.color = result.color;

      socket.emit(events.ROOM_JOINED, {
        color: result.color,
        roomId: result.roomId,
        state: result.state,
      });

      io.to(result.roomId).emit(events.ROOM_UPDATE, { state: result.state });
      logger.info(`${payload.playerName} (${result.color}) joined room ${result.roomId}`);
    } catch (error) {
      logger.warn(`[socket] joinRoom failed room=${payload.roomId || 'missing'} player=${payload.playerName || 'guest'}: ${error.message}`);
      emitSocketError(socket, error);
    }
  });

  socket.on(events.MAKE_MOVE, (payload = {}) => {
    try {
      const result = gameService.makeMove({
        roomId: socket.data.roomId,
        color: socket.data.color,
        from: payload.from,
        to: payload.to,
        promotion: payload.promotion,
      });

      if (result.event === 'gameOver') {
        io.to(socket.data.roomId).emit(events.GAME_OVER, {
          result: result.result,
          state: result.state,
        });
        return;
      }

      io.to(socket.data.roomId).emit(events.MOVE_MADE, {
        move: result.move,
        state: result.state,
      });
    } catch (error) {
      emitSocketError(socket, error);
    }
  });

  socket.on(events.RESIGN, () => {
    const result = gameService.resign({
      roomId: socket.data.roomId,
      color: socket.data.color,
    });

    if (result) {
      io.to(socket.data.roomId).emit(events.GAME_OVER, result);
    }
  });

  socket.on(events.REQUEST_RESTART, () => {
    if (!socket.data.roomId) return;
    socket.to(socket.data.roomId).emit(events.RESTART_REQUESTED, { by: socket.data.color });
  });

  socket.on(events.ACCEPT_RESTART, () => {
    const result = gameService.acceptRestart({
      roomId: socket.data.roomId,
      updateSocketColor: (socketId, color) => {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (targetSocket) targetSocket.data.color = color;
      },
    });

    if (result) {
      io.to(socket.data.roomId).emit(events.GAME_RESTARTED, result);
    }
  });

  socket.on(events.DISCONNECT, () => {
    const result = gameService.markDisconnected({
      roomId: socket.data.roomId,
      color: socket.data.color,
    });

    if (!result) return;

    socket.to(socket.data.roomId).emit(events.PLAYER_DISCONNECTED, { color: result.color });
    gameService.scheduleCleanup(socket.data.roomId);
  });

  socket.on(events.RECONNECT_TO_ROOM, (payload = {}) => {
    try {
      const result = gameService.reconnect({
        roomId: payload.roomId,
        playerName: payload.playerName,
        color: payload.color,
        socketId: socket.id,
      });

      socket.data.roomId = result.roomId;
      socket.data.color = result.color;
      socket.join(result.roomId);

      socket.emit(events.RECONNECTED, {
        color: result.color,
        roomId: result.roomId,
        state: result.state,
      });

      socket.to(result.roomId).emit(events.PLAYER_RECONNECTED, { color: result.color });
      logger.info(`${payload.playerName} (${result.color}) reconnected to room ${result.roomId}`);
    } catch (error) {
      logger.warn(`[socket] reconnectToRoom failed room=${payload.roomId || 'missing'} player=${payload.playerName || 'guest'}: ${error.message}`);
      emitSocketError(socket, error);
    }
  });
}

module.exports = registerGameSocket;
