const express = require('express');
const authRoutes = require('./auth.routes');
const gameRoutes = require('./game.routes');
const inviteRoutes = require('./invite.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(gameRoutes);
router.use(inviteRoutes);

module.exports = router;
