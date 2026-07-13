const { v4: uuidv4 } = require('uuid');
const { createInvite } = require('./invite.model');
const gameService = require('../game/game.service');
const userRepository = require('../auth/user.repository');
const { sanitizeUser } = require('../../models/User');
const { AppError } = require('../../utils/errors');
const { validateEmail } = require('../../utils/validators');
const { getCollection, saveDatabase } = require('../../config/database');

class InviteService {
  invites() {
    return getCollection('invites');
  }

  create({ createdBy, invitedEmail, expiresInMs = 15 * 60 * 1000 }) {
    if (!createdBy?.id) throw new AppError('Authentication required', 401);

    const normalizedEmail = validateEmail(invitedEmail);
    const invitedPlayer = userRepository.findByEmail(normalizedEmail);
    if (!invitedPlayer) throw new AppError('No player found with that email', 404);
    if (invitedPlayer.id === createdBy.id) throw new AppError('You cannot invite yourself');

    const duplicateInvite = this.invites().find((invite) => (
      invite.createdByUserId === createdBy.id
      && invite.invitedUserId === invitedPlayer.id
      && invite.status === 'pending'
      && new Date(invite.expiresAt).getTime() > Date.now()
    ));
    if (duplicateInvite) throw new AppError('A pending invite already exists for this player', 409);

    const { roomId } = gameService.createRoom({ userId: createdBy.id });
    const id = uuidv4();
    const invite = createInvite({
      id,
      roomId,
      createdBy: sanitizeUser(createdBy),
      invitedPlayer: sanitizeUser(invitedPlayer),
      expiresAt: new Date(Date.now() + expiresInMs),
    });

    this.invites().push(invite);
    saveDatabase();
    return invite;
  }

  get(inviteId) {
    return this.invites().find((invite) => invite.id === inviteId) || null;
  }

  listForUser(userId) {
    let changed = false;
    const now = Date.now();

    this.invites().forEach((invite) => {
      if (invite.status === 'pending' && new Date(invite.expiresAt).getTime() <= now) {
        invite.status = 'expired';
        invite.updatedAt = new Date().toISOString();
        changed = true;
      }
    });
    if (changed) saveDatabase();

    const relevantInvites = this.invites()
      .filter((invite) => invite.createdByUserId === userId || invite.invitedUserId === userId)
      .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt));

    return {
      incoming: relevantInvites.filter((invite) => invite.invitedUserId === userId),
      outgoing: relevantInvites.filter((invite) => invite.createdByUserId === userId),
    };
  }

  accept(inviteId, userId) {
    const invite = this.validate(inviteId);
    if (invite.invitedUserId !== userId) {
      throw new AppError('Only the invited player can accept this invite', 403);
    }
    invite.status = 'accepted';
    invite.updatedAt = new Date().toISOString();
    saveDatabase();
    return invite;
  }

  reject(inviteId, userId) {
    const invite = this.validate(inviteId);
    if (invite.invitedUserId !== userId) {
      throw new AppError('Only the invited player can reject this invite', 403);
    }
    invite.status = 'rejected';
    invite.updatedAt = new Date().toISOString();
    saveDatabase();
    return invite;
  }

  expire(inviteId, userId) {
    const invite = this.get(inviteId);
    if (!invite) throw new AppError('Invite not found', 404);
    if (invite.createdByUserId !== userId) {
      throw new AppError('Only the inviting player can cancel this invite', 403);
    }
    if (invite.status !== 'pending') {
      throw new AppError(`Invite is already ${invite.status}`);
    }
    invite.status = 'expired';
    invite.updatedAt = new Date().toISOString();
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
