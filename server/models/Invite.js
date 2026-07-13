function createInvite({ id, roomId, createdBy, invitedPlayer, expiresAt }) {
  const now = new Date().toISOString();

  return {
    id,
    roomId,
    createdBy,
    createdByUserId: createdBy?.id || createdBy || null,
    invitedPlayer,
    invitedUserId: invitedPlayer?.id || null,
    status: 'pending',
    expiresAt: new Date(expiresAt).toISOString(),
    createdAt: now,
    updatedAt: now,
  };
}

module.exports = {
  createInvite,
};
