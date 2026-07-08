const { v4: uuidv4 } = require('uuid');
const { GAME_CONFIG } = require('./constants');

function generateRoomCode() {
  return uuidv4().slice(0, GAME_CONFIG.ROOM_CODE_LENGTH).toUpperCase();
}

module.exports = {
  generateRoomCode,
};
