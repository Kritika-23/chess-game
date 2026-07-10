const crypto = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { serializeCookie, getCookieOptions } = require('../utils/cookies');

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_TTL_MS = 60 * 60 * 1000;
const issuedTokens = new Map();

function rememberCsrfToken(token) {
  issuedTokens.set(token, Date.now() + TOKEN_TTL_MS);
}

function pruneExpiredTokens() {
  const now = Date.now();
  issuedTokens.forEach((expiresAt, token) => {
    if (expiresAt <= now) issuedTokens.delete(token);
  });
}

function isKnownCsrfToken(token) {
  if (!token) return false;
  const expiresAt = issuedTokens.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    issuedTokens.delete(token);
    return false;
  }
  return true;
}

function createCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function setCsrfCookie(res, token = createCsrfToken()) {
  pruneExpiredTokens();
  rememberCsrfToken(token);
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
  const hasMatchingCookieToken = cookieToken && headerToken && cookieToken === headerToken;
  const hasKnownHeaderToken = headerToken && isKnownCsrfToken(headerToken);

  if (!hasMatchingCookieToken && !hasKnownHeaderToken) {
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
