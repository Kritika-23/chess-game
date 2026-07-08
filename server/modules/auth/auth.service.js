const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const env = require('../../config/env');
const userRepository = require('./user.repository');
const emailService = require('./email.service');
const { createUser, sanitizeUser } = require('../../models/User');
const { AppError } = require('../../utils/errors');
const {
  requireString,
  requireSafeString,
  validateEmail,
  validatePassword,
  validateOptionalUrl,
} = require('../../utils/validators');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../../utils/tokens');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function buildFrontendUrl(pathname, token) {
  const url = new URL(pathname, env.frontendUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

function isExpired(record) {
  return !record?.expiresAt || new Date(record.expiresAt).getTime() <= Date.now();
}

class AuthService {
  async register({ email, password, name }) {
    const normalizedEmail = validateEmail(email);
    const displayName = requireSafeString(name, 'Name', { min: 2, max: 50 });
    const validPassword = validatePassword(password);

    if (userRepository.findByEmail(normalizedEmail)) {
      throw new AppError('Email is already registered', 409);
    }

    const passwordHash = await bcrypt.hash(validPassword, 12);
    const user = userRepository.create(createUser({
      email: normalizedEmail,
      passwordHash,
      name: displayName,
    }));

    const verification = this.createEmailVerificationToken(user.id);
    const verificationUrl = buildFrontendUrl('/verify-email', verification.token);
    await this.sendEmailVerificationLink(user, verificationUrl);

    return {
      user: sanitizeUser(user),
    };
  }

  async login({ email, password }) {
    const normalizedEmail = validateEmail(email);
    const providedPassword = requireString(password, 'Password', { min: 1, max: 128 });
    const user = userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatches = await bcrypt.compare(providedPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.emailVerified) {
      throw new AppError('Please verify your email before signing in', 403);
    }

    return this.createSession(user);
  }

  logout({ refreshToken, userId }) {
    if (refreshToken) {
      userRepository.revokeRefreshToken(hashToken(refreshToken));
      return;
    }

    if (userId) {
      userRepository.revokeUserRefreshTokens(userId);
    }
  }

  refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError('Refresh token is invalid', 401);
    }
    const tokenRecord = userRepository.findRefreshToken(hashToken(refreshToken));
    if (!tokenRecord || tokenRecord.userId !== payload.sub) {
      throw new AppError('Refresh token is invalid', 401);
    }

    if (isExpired(tokenRecord)) {
      userRepository.revokeRefreshToken(hashToken(refreshToken));
      throw new AppError('Refresh token is expired', 401);
    }

    const user = userRepository.findById(payload.sub);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    userRepository.revokeRefreshToken(hashToken(refreshToken));
    return this.createSession(user);
  }

  getProfile(userId) {
    const user = userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return sanitizeUser(user);
  }
updateProfile(userId, updates) {
  const allowedUpdates = {};

  if (updates.name !== undefined) {
    allowedUpdates.name = requireSafeString(updates.name, "Name", {
      min: 2,
      max: 50,
    });
  }

  if (updates.username !== undefined) {
    allowedUpdates.username = requireSafeString(updates.username, "Username", {
      min: 3,
      max: 30,
    });
  }

  if (updates.bio !== undefined) {
    allowedUpdates.bio = requireSafeString(updates.bio, "Bio", {
      min: 0,
      max: 500,
    });
  }

  if (updates.country !== undefined) {
    allowedUpdates.country = requireSafeString(updates.country, "Country", {
      min: 0,
      max: 50,
    });
  }

  if (updates.gender !== undefined) {
    allowedUpdates.gender = requireSafeString(updates.gender, "Gender", {
      min: 0,
      max: 20,
    });
  }

  if (updates.dateOfBirth !== undefined) {
    allowedUpdates.dateOfBirth = updates.dateOfBirth;
  }

  if (updates.avatarUrl !== undefined) {
    allowedUpdates.avatarUrl = validateOptionalUrl(
      updates.avatarUrl,
      "Avatar URL"
    );
  }

 allowedUpdates.updatedAt = new Date().toISOString();

const user = userRepository.update(userId, allowedUpdates);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return sanitizeUser(user);
}
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = userRepository.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const providedPassword = requireString(currentPassword, 'Current password', { min: 1, max: 128 });
    const passwordMatches = await bcrypt.compare(providedPassword, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('Current password is incorrect', 401);
    }

    const validNewPassword = validatePassword(newPassword, 'New password');
    const passwordHash = await bcrypt.hash(validNewPassword, 12);
    userRepository.update(userId, { passwordHash });
    userRepository.revokeUserRefreshTokens(userId);
  }

  async requestEmailVerification({ email }) {
    const normalizedEmail = validateEmail(email);
    const user = userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return this.emailSentResponse();
    }

    if (user.emailVerified) {
      return this.emailSentResponse();
    }

    const verification = this.createEmailVerificationToken(user.id);
    const verificationUrl = buildFrontendUrl('/verify-email', verification.token);
    await this.sendEmailVerificationLink(user, verificationUrl);
    return this.emailSentResponse();
  }

  verifyEmail(token) {
    const providedToken = requireString(token, 'Verification token', { min: 16, max: 256 });
    const tokenHash = hashToken(providedToken);
    const record = userRepository.findEmailVerificationToken(tokenHash);

    if (!record || isExpired(record)) {
      throw new AppError('Verification token is invalid or expired', 400);
    }

    const user = userRepository.update(record.userId, { emailVerified: true });
    if (!user) throw new AppError('User not found', 404);

    userRepository.markEmailVerificationTokenUsed(tokenHash);
    return this.createSession(user);
  }

  async requestPasswordReset({ email }) {
    const normalizedEmail = validateEmail(email);
    const user = userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return this.emailSentResponse();
    }

    const reset = this.createPasswordResetToken(user.id);
    const resetUrl = buildFrontendUrl('/reset-password', reset.token);
    await this.sendPasswordResetLink(user, resetUrl);
    return this.emailSentResponse();
  }

  async resetPassword({ token, password }) {
    const providedToken = requireString(token, 'Reset token', { min: 16, max: 256 });
    const validPassword = validatePassword(password, 'Password');
    const tokenHash = hashToken(providedToken);
    const record = userRepository.findPasswordResetToken(tokenHash);

    if (!record || isExpired(record)) {
      throw new AppError('Reset token is invalid or expired', 400);
    }

    const passwordHash = await bcrypt.hash(validPassword, 12);
    const user = userRepository.update(record.userId, { passwordHash });
    if (!user) throw new AppError('User not found', 404);

    userRepository.markPasswordResetTokenUsed(tokenHash);
    userRepository.revokeUserRefreshTokens(user.id);
  }

  createSession(user) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshPayload = verifyRefreshToken(refreshToken);

    userRepository.saveRefreshToken({
      id: uuidv4(),
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      tokenId: refreshPayload.tokenId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      revokedAt: null,
    });

    return {
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  createEmailVerificationToken(userId) {
    const token = createOpaqueToken();
    userRepository.saveEmailVerificationToken({
      id: uuidv4(),
      userId,
      tokenHash: hashToken(token),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      usedAt: null,
    });

    return { token };
  }

  createPasswordResetToken(userId) {
    const token = createOpaqueToken();
    userRepository.savePasswordResetToken({
      id: uuidv4(),
      userId,
      tokenHash: hashToken(token),
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      usedAt: null,
    });

    return { token };
  }

  emailSentResponse() {
    return {
      sent: true,
      message: 'If an account exists, an email has been sent.',
    };
  }

  async sendPasswordResetLink(user, resetUrl) {
    await this.sendEmailOrLogDevelopmentUrl({
      url: resetUrl,
      logLabel: 'Password reset URL',
      send: () => emailService.sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      }),
    });
  }

  async sendEmailVerificationLink(user, verificationUrl) {
    await this.sendEmailOrLogDevelopmentUrl({
      url: verificationUrl,
      logLabel: 'Email verification URL',
      send: () => emailService.sendEmailVerificationEmail({
        to: user.email,
        verificationUrl,
      }),
    });
  }

  async sendEmailOrLogDevelopmentUrl({ url, logLabel, send }) {
    if (!emailService.isConfigured()) {
      if (env.nodeEnv !== 'production') {
        console.info(`[auth] SMTP is not configured. ${logLabel}: ${url}`);
        return;
      }

      throw new AppError('Email service is not configured', 500);
    }

    try {
      await send();
    } catch (error) {
      if (env.nodeEnv !== 'production') {
        console.info(`[auth] Email delivery failed. ${logLabel}: ${url}`);
        return;
      }

      throw error;
    }
  }
}

module.exports = new AuthService();
