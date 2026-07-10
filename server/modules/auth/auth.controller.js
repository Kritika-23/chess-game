const authService = require('./auth.service');
const env = require('../../config/env');
const { getRefreshToken } = require('../../utils/tokens');
const { serializeCookie, getCookieOptions } = require('../../utils/cookies');
const { setCsrfCookie } = require('../../middleware/csrf');

function setAuthCookies(res, session) {
  res.append('Set-Cookie', serializeCookie('accessToken', session.accessToken, getCookieOptions(env, {
    maxAge: 15 * 60,
  })));
  res.append('Set-Cookie', serializeCookie('refreshToken', session.refreshToken, getCookieOptions(env, {
    maxAge: 7 * 24 * 60 * 60,
  })));
  setCsrfCookie(res);
}

function clearAuthCookies(res) {
  res.append('Set-Cookie', serializeCookie('accessToken', '', getCookieOptions(env, {
    maxAge: 0,
  })));
  res.append('Set-Cookie', serializeCookie('refreshToken', '', getCookieOptions(env, {
    maxAge: 0,
  })));
}

function sessionResponse(session) {
  const { accessToken, refreshToken, ...safeSession } = session;
  return safeSession;
}

function buildFrontendRedirect(params = {}) {
  const url = new URL('/', env.frontendUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function csrf(req, res) {
  res.json({ csrfToken: setCsrfCookie(res) });
}

async function register(req, res) {
  res.status(201).json(await authService.register(req.body || {}));
}

async function login(req, res) {
  const session = await authService.login(req.body || {});
  setAuthCookies(res, session);
  res.json(sessionResponse(session));
}

async function logout(req, res) {
  authService.logout({
    refreshToken: getRefreshToken(req),
    userId: req.user?.id,
  });
  clearAuthCookies(res);
  res.status(204).send();
}

async function refresh(req, res) {
  const session = authService.refresh(getRefreshToken(req));
  setAuthCookies(res, session);
  res.json(sessionResponse(session));
}

async function getProfile(req, res) {
  res.json({ user: authService.getProfile(req.user.id) });
}

async function updateProfile(req, res) {
  const user = authService.updateProfile(req.user.id, req.body || {});
  res.json({ user });
}

async function uploadAvatar(req, res) {
  const user = await authService.uploadAvatar(req.user.id, req.body || {});
  res.json({ user });
}

async function changePassword(req, res) {
  await authService.changePassword(req.user.id, req.body || {});
  clearAuthCookies(res);
  res.status(204).send();
}

async function requestEmailVerification(req, res) {
  res.json(await authService.requestEmailVerification(req.body || {}));
}

async function requestCurrentUserEmailVerification(req, res) {
  res.json(await authService.requestCurrentUserEmailVerification(req.user.id));
}

async function verifyEmail(req, res) {
  res.json(authService.verifyEmail(req.body?.token));
}

async function verifyEmailRedirect(req, res) {
  try {
    authService.verifyEmail(req.query?.token);
    res.redirect(302, buildFrontendRedirect({ emailVerified: '1' }));
  } catch (error) {
    res.redirect(302, buildFrontendRedirect({ emailVerificationError: '1' }));
  }
}

async function requestPasswordReset(req, res) {
  res.json(await authService.requestPasswordReset(req.body || {}));
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body || {});
  clearAuthCookies(res);
  res.status(204).send();
}

module.exports = {
  csrf,
  register,
  login,
  logout,
  refresh,
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  requestEmailVerification,
  requestCurrentUserEmailVerification,
  verifyEmail,
  verifyEmailRedirect,
  requestPasswordReset,
  resetPassword,
};
