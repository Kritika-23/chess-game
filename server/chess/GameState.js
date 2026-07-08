const { createGameState } = require('../models/GameState');

function getRoomPublicState(room) {
  return createGameState(room);
}

module.exports = {
  getRoomPublicState,
};
