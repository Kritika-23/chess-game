const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const inviteController = require('./invite.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/invites', requireAuth, asyncHandler(inviteController.createInvite));
router.get('/invites', requireAuth, asyncHandler(inviteController.listInvites));
router.post('/invites/:inviteId/accept', requireAuth, asyncHandler(inviteController.acceptInvite));
router.post('/invites/:inviteId/reject', requireAuth, asyncHandler(inviteController.rejectInvite));
router.post('/invites/:inviteId/expire', requireAuth, asyncHandler(inviteController.expireInvite));

module.exports = router;
