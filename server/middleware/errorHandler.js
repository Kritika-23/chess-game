const logger = require('../utils/logger');

module.exports = function errorHandler(error, req, res, next) {
  const statusCode = error.type === 'entity.parse.failed' ? 400 : error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Internal server error';
  const responseMessage = error.type === 'entity.parse.failed' ? 'Invalid JSON payload' : message;

  if (statusCode >= 500) {
    logger.error(message, error);
  }

  res.status(statusCode).json({ error: responseMessage });
};
