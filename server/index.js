const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const env = require('./config/env');
const socketConfig = require('./config/socket');
const { connectDatabase } = require('./config/database');
const routes = require('./routes');
const registerSockets = require('./sockets');
const gameService = require('./modules/game/game.service');
const cookieParser = require('./middleware/cookieParser');
const sanitizeBody = require('./middleware/sanitizeBody');
const securityHeaders = require('./middleware/securityHeaders');
const { csrfProtection } = require('./middleware/csrf');
const { createRateLimiter } = require('./middleware/rateLimit');
const requestLogger = require('./middleware/requestLogger');
const { attachUser } = require('./middleware/auth.middleware');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = new Server(server, socketConfig);

app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(createRateLimiter({ windowMs: 60 * 1000, max: 300, keyPrefix: 'api' }));
app.use(express.json({ limit: '20kb' }));
app.use(sanitizeBody);
app.use(cookieParser);
app.use(requestLogger);
app.use(csrfProtection);
app.use(attachUser);
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

registerSockets(io);

async function startServer() {
  await connectDatabase();
  gameService.hydrateRooms();

  server.listen(env.port, () => {
    logger.info(`Chess server running on http://localhost:${env.port}`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
