const { getCollection, saveDatabase } = require('../../config/database');

class UserRepository {
  users() {
    return getCollection('users');
  }

  refreshTokens() {
    return getCollection('refreshTokens');
  }

  emailVerificationTokens() {
    return getCollection('emailVerificationTokens');
  }

  passwordResetTokens() {
    return getCollection('passwordResetTokens');
  }

  findById(userId) {
    return this.users().find((user) => user.id === userId) || null;
  }

  findByEmail(email) {
    return this.users().find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
  }

  create(user) {
    this.users().push(user);
    saveDatabase();
    return user;
  }

  update(userId, updates) {
    const user = this.findById(userId);
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    saveDatabase();
    return user;
  }

  saveRefreshToken(tokenRecord) {
    this.refreshTokens().push(tokenRecord);
    saveDatabase();
    return tokenRecord;
  }

  findRefreshToken(tokenHash) {
    return this.refreshTokens().find((record) => record.tokenHash === tokenHash && !record.revokedAt) || null;
  }

  revokeRefreshToken(tokenHash) {
    const record = this.refreshTokens().find((item) => item.tokenHash === tokenHash);
    if (record) {
      record.revokedAt = new Date().toISOString();
      saveDatabase();
    }
  }

  revokeUserRefreshTokens(userId) {
    this.refreshTokens().forEach((record) => {
      if (record.userId && record.userId === userId && !record.revokedAt) {
        record.revokedAt = new Date().toISOString();
      }
    });
    saveDatabase();
  }

  saveEmailVerificationToken(tokenRecord) {
    this.emailVerificationTokens().push(tokenRecord);
    saveDatabase();
    return tokenRecord;
  }

  findEmailVerificationToken(tokenHash) {
    return this.emailVerificationTokens().find((record) => record.tokenHash === tokenHash && !record.usedAt) || null;
  }

  markEmailVerificationTokenUsed(tokenHash) {
    const record = this.findEmailVerificationToken(tokenHash);
    if (record) {
      record.usedAt = new Date().toISOString();
      saveDatabase();
    }
  }

  savePasswordResetToken(tokenRecord) {
    this.passwordResetTokens().push(tokenRecord);
    saveDatabase();
    return tokenRecord;
  }

  findPasswordResetToken(tokenHash) {
    return this.passwordResetTokens().find((record) => record.tokenHash === tokenHash && !record.usedAt) || null;
  }

  markPasswordResetTokenUsed(tokenHash) {
    const record = this.findPasswordResetToken(tokenHash);
    if (record) {
      record.usedAt = new Date().toISOString();
      saveDatabase();
    }
  }
}

module.exports = new UserRepository();
