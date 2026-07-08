const { AppError } = require('../utils/errors');

module.exports = function notFound(req, res, next) {
  next(new AppError('Route not found', 404));
};
