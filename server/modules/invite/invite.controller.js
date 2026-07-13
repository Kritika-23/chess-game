const inviteService = require('./invite.service');

async function createInvite(req, res) {
  const invite = inviteService.create({
    ...(req.body || {}),
    createdBy: req.user,
  });
  req.app.get('io')?.to(`user:${invite.invitedUserId}`).emit('invite:received', { invite });
  res.status(201).json({ invite });
}

async function listInvites(req, res) {
  res.json(inviteService.listForUser(req.user.id));
}

async function acceptInvite(req, res) {
  const invite = inviteService.accept(req.params.inviteId, req.user.id);
  req.app.get('io')?.to(`user:${invite.createdByUserId}`).emit('invite:updated', { invite });
  res.json({ invite });
}

async function rejectInvite(req, res) {
  const invite = inviteService.reject(req.params.inviteId, req.user.id);
  req.app.get('io')?.to(`user:${invite.createdByUserId}`).emit('invite:updated', { invite });
  res.json({ invite });
}

async function expireInvite(req, res) {
  const invite = inviteService.expire(req.params.inviteId, req.user.id);
  req.app.get('io')?.to(`user:${invite.invitedUserId}`).emit('invite:updated', { invite });
  res.json({ invite });
}

module.exports = {
  createInvite,
  listInvites,
  acceptInvite,
  rejectInvite,
  expireInvite,
};
