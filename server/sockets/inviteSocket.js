const inviteService = require('../modules/invite/invite.service');
const { canUseGuestMode } = require('./socketAuth');

function registerInviteSocket(io, socket) {
  socket.on('invite:create', (payload = {}) => {
    if (!socket.data.user && !canUseGuestMode()) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    const invite = inviteService.create({
      ...payload,
      createdBy: socket.data.user,
    });

    socket.emit('invite:created', { invite });
  });
}

module.exports = registerInviteSocket;
