const inviteService = require('../modules/invite/invite.service');
const { canUseGuestMode } = require('./socketAuth');

function registerInviteSocket(io, socket) {
  socket.on('invite:create', (payload = {}) => {
    if (!socket.data.user && !canUseGuestMode()) {
      socket.emit('error', { message: 'Authentication required' });
      return;
    }

    try {
      const invite = inviteService.create({
        ...payload,
        createdBy: socket.data.user,
      });

      socket.emit('invite:created', { invite });
      io.to(`user:${invite.invitedUserId}`).emit('invite:received', { invite });
    } catch (error) {
      socket.emit('error', { message: error.message || 'Unable to create invite' });
    }
  });
}

module.exports = registerInviteSocket;
