const inviteService = require('./invite.service');

async function createInvite(req, res) {
  const invite = inviteService.create({
    ...(req.body || {}),
    createdBy: req.user,
  });
  res.status(201).json({ invite });
}

async function acceptInvite(req, res) {
  const invite = inviteService.accept(req.params.inviteId);
  res.json({ invite });
}

async function rejectInvite(req, res) {
  const invite = inviteService.reject(req.params.inviteId);
  res.json({ invite });
}

async function expireInvite(req, res) {
  const invite = inviteService.expire(req.params.inviteId);
  res.json({ invite });
}

module.exports = {
  createInvite,
  acceptInvite,
  rejectInvite,
  expireInvite,
};
