const crypto = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { serializeCookie, getCookieOptions } = require('../utils/cookies');

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function createCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function setCsrfCookie(res, token = createCsrfToken()) {
  res.append(
    'Set-Cookie',
    serializeCookie(CSRF_COOKIE, token, getCookieOptions(env, {
      httpOnly: false,
      maxAge: 60 * 60,
    }))
  );
  return token;
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.path === '/api/auth/csrf') return next();

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return next(new AppError('Invalid CSRF token', 403));
  }

  return next();
}

module.exports = {
  CSRF_COOKIE,
  createCsrfToken,
  setCsrfCookie,
  csrfProtection,
};
