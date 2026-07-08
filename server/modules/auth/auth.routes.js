const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const authController = require('./auth.controller');
const { requireAuth } = require('../../middleware/auth.middleware');
const { createRateLimiter } = require('../../middleware/rateLimit');

const router = express.Router();
const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'auth' });
const strictAuthLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: 'auth-strict' });

router.get('/auth/csrf', asyncHandler(authController.csrf));
router.post('/auth/register', authLimiter, asyncHandler(authController.register));
router.post('/auth/login', strictAuthLimiter, asyncHandler(authController.login));
router.post('/auth/refresh', authLimiter, asyncHandler(authController.refresh));
router.post('/auth/logout', requireAuth, asyncHandler(authController.logout));
router.post('/auth/email/verification', strictAuthLimiter, asyncHandler(authController.requestEmailVerification));
router.post('/auth/email/verify', authLimiter, asyncHandler(authController.verifyEmail));
router.post('/auth/password/forgot', strictAuthLimiter, asyncHandler(authController.requestPasswordReset));
router.post('/auth/password/reset', strictAuthLimiter, asyncHandler(authController.resetPassword));
router.get('/users/me', requireAuth, asyncHandler(authController.getProfile));
router.patch('/users/me', requireAuth, asyncHandler(authController.updateProfile));
router.post('/users/me/password', requireAuth, asyncHandler(authController.changePassword));

module.exports = router;
