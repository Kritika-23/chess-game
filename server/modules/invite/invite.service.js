const { v4: uuidv4 } = require('uuid');
const { createInvite } = require('./invite.model');
const gameService = require('../game/game.service');
const { AppError } = require('../../utils/errors');
const { getCollection, saveDatabase } = require('../../config/database');

class InviteService {
  invites() {
    return getCollection('invites');
  }

  create({ createdBy, invitedPlayer, expiresInMs = 15 * 60 * 1000 }) {
    const { roomId } = gameService.createRoom({ userId: createdBy?.id || null });
    const id = uuidv4();
    const invite = createInvite({
      id,
      roomId,
      createdBy,
      invitedPlayer,
      expiresAt: new Date(Date.now() + expiresInMs),
    });

    this.invites().push(invite);
    saveDatabase();
    return invite;
  }

  get(inviteId) {
    return this.invites().find((invite) => invite.id === inviteId) || null;
  }

  accept(inviteId) {
    const invite = this.validate(inviteId);
    invite.status = 'accepted';
    saveDatabase();
    return invite;
  }

  reject(inviteId) {
    const invite = this.validate(inviteId);
    invite.status = 'rejected';
    saveDatabase();
    return invite;
  }

  expire(inviteId) {
    const invite = this.get(inviteId);
    if (!invite) throw new AppError('Invite not found', 404);
    invite.status = 'expired';
    saveDatabase();
    return invite;
  }

  validate(inviteId) {
    const invite = this.get(inviteId);
    if (!invite) throw new AppError('Invite not found', 404);

    if (invite.status !== 'pending') {
      throw new AppError(`Invite is already ${invite.status}`);
    }

    if (new Date(invite.expiresAt).getTime() <= Date.now()) {
      invite.status = 'expired';
      saveDatabase();
      throw new AppError('Invite has expired');
    }

    return invite;
  }
}

module.exports = new InviteService();
