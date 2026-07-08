const { verifyAccessToken } = require('../utils/tokens');
const { parseCookies } = require('../utils/cookies');
const userRepository = require('../modules/auth/user.repository');

function authenticateSocket(socket) {
  const cookies = parseCookies(socket.handshake.headers?.cookie || '');
  const token =
    cookies.accessToken ||
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    socket.data.user = null;
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = userRepository.findById(payload.sub);
    socket.data.user = user || null;
    return socket.data.user;
  } catch (error) {
    socket.data.user = null;
    socket.data.authError = error;
    return null;
  }
}

function canUseGuestMode() {
  return false;
}

module.exports = {
  authenticateSocket,
  canUseGuestMode,
};
