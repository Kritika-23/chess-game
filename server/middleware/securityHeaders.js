const env = require('../config/env');

function uniqueSources(sources) {
  return [...new Set(sources.filter(Boolean))];
}

module.exports = function securityHeaders(req, res, next) {
  const connectSources = uniqueSources([
    "'self'",
    env.backendUrl,
    'http://localhost:3001',
    'ws://localhost:3001',
    env.backendUrl?.replace(/^http/, 'ws'),
  ]);
  const imageSources = uniqueSources([
    "'self'",
    'data:',
    env.backendUrl,
    'http://localhost:3001',
  ]);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `img-src ${imageSources.join(' ')}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSources.join(' ')}`,
      "script-src 'self'",
    ].join('; ')
  );
  next();
};
