const { AppError } = require('../utils/errors');
const { getAccessToken, verifyAccessToken } = require('../utils/tokens');
const userRepository = require('../modules/auth/user.repository');

function attachUser(req, res, next) {
  const token = getAccessToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const user = userRepository.findById(payload.sub);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    req.authError = error;
  }

  next();
}

function requireAuth(req, res, next) {
  if (req.user) return next();
  next(new AppError('Authentication required', 401));
}

function requireAuthUnlessGuest(req, res, next) {
  return requireAuth(req, res, next);
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role || 'player')) {
      return next(new AppError('Insufficient permissions', 403));
    }
    return next();
  };
}

module.exports = {
  attachUser,
  requireAuth,
  requireAuthUnlessGuest,
  requireRole,
};
