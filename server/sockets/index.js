const registerGameSocket = require('./gameSocket');
const registerInviteSocket = require('./inviteSocket');
const gameService = require('../modules/game/game.service');
const events = require('./socketEvents');
const { authenticateSocket } = require('./socketAuth');

function registerSockets(io) {
  gameService.configurePublisher({
    timerUpdate: (roomId, payload) => {
      io.to(roomId).emit(events.TIMER_UPDATE, payload);
    },
    gameOver: (roomId, payload) => {
      io.to(roomId).emit(events.GAME_OVER, payload);
    },
  });

  io.on(events.CONNECTION, (socket) => {
    authenticateSocket(socket);
    registerGameSocket(io, socket);
    registerInviteSocket(io, socket);
  });
}

module.exports = registerSockets;
