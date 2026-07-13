const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const path = require('path');

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

const DEFAULT_MAX_REQUEST_HEADER_SIZE = 64 * 1024;
const maxRequestHeaderSize =
  Number(process.env.MAX_REQUEST_HEADER_SIZE) || DEFAULT_MAX_REQUEST_HEADER_SIZE;
const debugRequestHeaders = process.env.DEBUG_REQUEST_HEADERS === 'true';

const app = express();
const server = http.createServer({ maxHeaderSize: maxRequestHeaderSize }, app);
const io = new Server(server, socketConfig);
app.set('io', io);

function isAllowedCorsOrigin(origin) {
  if (!origin) return true;
  return env.corsOrigins.includes(origin);
}

function logRequestHeaders(req, res, next) {
  if (debugRequestHeaders) {
    const cookieHeader = req.headers.cookie || '';
    const authorizationHeader = req.headers.authorization || '';

    logger.info(`Request header debug ${JSON.stringify({
      url: req.originalUrl || req.url,
      headers: req.headers,
      cookieLength: cookieHeader.length,
      authorizationLength: authorizationHeader.length,
    })}`);
  }

  next();
}

server.on('clientError', (error, socket) => {
  logger.warn(`HTTP client error before Express ${JSON.stringify({
    code: error.code,
    message: error.message,
    bytesParsed: error.bytesParsed,
    maxRequestHeaderSize,
  })}`);

  if (!socket.writable) return;

  const statusLine = error.code === 'HPE_HEADER_OVERFLOW'
    ? 'HTTP/1.1 431 Request Header Fields Too Large'
    : 'HTTP/1.1 400 Bad Request';
  const body = JSON.stringify({ error: 'Request headers are too large' });

  socket.end([
    statusLine,
    'Connection: close',
    'Content-Type: application/json',
    `Content-Length: ${Buffer.byteLength(body)}`,
    '',
    body,
  ].join('\r\n'));
});

app.set('trust proxy', 1);
app.use(logRequestHeaders);
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    callback(null, isAllowedCorsOrigin(origin));
  },
  credentials: true,
}));
app.use(createRateLimiter({ windowMs: 60 * 1000, max: 300, keyPrefix: 'api' }));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads'), {
  fallthrough: false,
  immutable: true,
  maxAge: '7d',
}));
app.use(express.json({ limit: '3mb' }));
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
