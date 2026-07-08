const express = require('express');
const asyncHandler = require('../../utils/asyncHandler');
const gameController = require('./game.controller');
const { requireAuth } = require('../../middleware/auth.middleware');

const router = express.Router();

router.post('/rooms', requireAuth, asyncHandler(gameController.createRoom));
router.get('/rooms/:roomId', requireAuth, asyncHandler(gameController.getRoom));

module.exports = router;
