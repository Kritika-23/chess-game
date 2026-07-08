const { ROOM_STATUS } = require('../utils/constants');
const { AppError } = require('../utils/errors');

function validateMoveRequest({ room, color }) {
  if (!room) {
    throw new AppError('Room not found', 404);
  }

  if (room.status !== ROOM_STATUS.ACTIVE) {
    throw new AppError('Game is not active');
  }

  const expectedColor = room.chess.turn() === 'w' ? 'white' : 'black';
  if (color !== expectedColor) {
    throw new AppError("It's not your turn");
  }
}

module.exports = {
  validateMoveRequest,
};
