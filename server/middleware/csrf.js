const crypto = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { serializeCookie, getCookieOptions } = require('../utils/cookies');

const CSRF_COOKIE = 'csrfToken';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_TTL_MS = 60 * 60 * 1000;

function signCsrfPayload(payload) {
  return crypto
    .createHmac('sha256', env.jwtAccessSecret)
    .update(payload)
    .digest('base64url');
}

function createCsrfToken() {
  const payload = [
    crypto.randomBytes(32).toString('base64url'),
    Date.now() + TOKEN_TTL_MS,
  ].join('.');
  return `${payload}.${signCsrfPayload(payload)}`;
}

function isValidCsrfToken(token) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [nonce, expiresAt, signature] = parts;
  if (!nonce || !expiresAt || !signature) return false;
  if (Number(expiresAt) <= Date.now()) return false;

  const payload = `${nonce}.${expiresAt}`;
  const expectedSignature = signCsrfPayload(payload);
  if (signature.length !== expectedSignature.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
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
  const hasMatchingCookieToken = cookieToken && headerToken && cookieToken === headerToken;
  const hasValidHeaderToken = isValidCsrfToken(headerToken);

  if (!hasMatchingCookieToken && !hasValidHeaderToken) {
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
