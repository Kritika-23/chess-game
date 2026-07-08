function createPlayer({ socketId, name, color, userId = null, isGuest = true }) {
  return {
    socketId,
    userId,
    name,
    color,
    connected: true,
    isGuest,
  };
}

module.exports = {
  createPlayer,
};
