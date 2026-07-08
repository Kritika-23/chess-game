const gameService = require('./game.service');

async function createRoom(req, res) {
  res.json(gameService.createRoom({ userId: req.user?.id || null }));
}

async function getRoom(req, res) {
  res.json(gameService.getRoomSummary(req.params.roomId));
}

module.exports = {
  createRoom,
  getRoom,
};
