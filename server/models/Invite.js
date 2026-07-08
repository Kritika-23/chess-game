function createInvite({ id, roomId, createdBy, invitedPlayer, expiresAt }) {
  return {
    id,
    roomId,
    createdBy,
    createdByUserId: createdBy?.id || createdBy || null,
    invitedPlayer,
    invitedUserId: invitedPlayer?.id || null,
    status: 'pending',
    expiresAt,
    createdAt: new Date(),
  };
}

module.exports = {
  createInvite,
};
