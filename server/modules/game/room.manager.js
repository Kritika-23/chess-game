const { createRoom, createRoomFromSnapshot } = require('../../models/Room');
const logger = require('../../utils/logger');

class RoomManager {
  constructor() {
    this.rooms = {};
  }

  create(roomId, ownerId = null) {
    const normalizedRoomId = roomId.toUpperCase();
    const room = createRoom(normalizedRoomId, ownerId);
    this.rooms[normalizedRoomId] = room;
    logger.info(`[rooms] created ${normalizedRoomId}; active rooms=${Object.keys(this.rooms).join(',') || 'none'}`);
    return room;
  }

  get(roomId) {
    if (!roomId) return null;
    const normalizedRoomId = roomId.toUpperCase();
    const room = this.rooms[normalizedRoomId] || null;
    logger.info(`[rooms] lookup ${normalizedRoomId}: ${room ? 'hit' : 'miss'}; active rooms=${Object.keys(this.rooms).join(',') || 'none'}`);
    return room;
  }

  getOrCreate(roomId) {
    return this.get(roomId) || this.create(roomId);
  }

  has(roomId) {
    if (!roomId) return false;
    return Boolean(this.rooms[roomId.toUpperCase()]);
  }

  hydrate(snapshots = []) {
    this.rooms = {};

    snapshots.forEach((snapshot) => {
      if (!snapshot?.id) return;
      const normalizedRoomId = snapshot.id.toUpperCase();
      const room = createRoomFromSnapshot({ ...snapshot, id: normalizedRoomId });

      Object.keys(room.players).forEach((color) => {
        if (room.players[color]) {
          room.players[color].connected = false;
        }
      });

      this.rooms[normalizedRoomId] = room;
    });

    logger.info(`[rooms] hydrated ${Object.keys(this.rooms).length} room(s): ${Object.keys(this.rooms).join(',') || 'none'}`);
  }

  delete(roomId) {
    const normalizedRoomId = roomId.toUpperCase();
    delete this.rooms[normalizedRoomId];
    logger.info(`[rooms] deleted ${normalizedRoomId}; active rooms=${Object.keys(this.rooms).join(',') || 'none'}`);
  }

  countPlayers(room) {
    return (room.players.white ? 1 : 0) + (room.players.black ? 1 : 0);
  }
}

module.exports = new RoomManager();
