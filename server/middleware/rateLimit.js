const { AppError } = require('../utils/errors');

function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  keyPrefix = 'global',
  keyGenerator = (req) => req.ip,
  message = 'Too many requests. Please try again later.',
} = {}) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = `${keyPrefix}:${keyGenerator(req) || 'unknown'}`;
    const record = hits.get(key);

    if (!record || record.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return next(new AppError(message, 429));
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
};
