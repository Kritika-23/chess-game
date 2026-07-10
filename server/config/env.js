const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

function parseList(value, fallback = []) {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readEnv(name, fallback = '') {
  return (process.env[name] || fallback).trim();
}

function normalizeOrigin(origin) {
  return origin.trim().replace(/\/+$/, '');
}

function uniqueOrigins(origins) {
  return [...new Set(origins.filter(Boolean).map(normalizeOrigin))];
}

const port = Number(process.env.PORT) || 3001;
const backendUrl = readEnv('BACKEND_URL', `http://localhost:${port}`);
const frontendUrl = readEnv('FRONTEND_URL', 'http://localhost:3000');
const corsOrigins = uniqueOrigins([
  ...parseList(readEnv('CORS_ORIGINS')),
  readEnv('CORS_ORIGIN'),
  frontendUrl,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);

module.exports = {
  port,
  backendUrl,
  corsOrigins,
  corsOrigin: readEnv('CORS_ORIGIN', frontendUrl),
  frontendUrl,
  nodeEnv: readEnv('NODE_ENV', 'development'),
  databaseUrl: readEnv('DATABASE_URL') || null,
  smtpHost: readEnv('SMTP_HOST') || (readEnv('SMTP_USER') ? 'smtp.gmail.com' : ''),
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: readEnv('SMTP_SECURE') === 'true',
  smtpUser: readEnv('SMTP_USER'),
  smtpPass: readEnv('SMTP_PASS'),
  smtpFrom: readEnv('SMTP_FROM', 'Chess Game <no-reply@example.com>'),
  jwtAccessSecret: readEnv('JWT_ACCESS_SECRET', 'dev-access-secret-change-me'),
  jwtRefreshSecret: readEnv('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  jwtAccessExpiresIn: readEnv('JWT_ACCESS_EXPIRES_IN', '15m'),
  jwtRefreshExpiresIn: readEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
  cookieSecure: readEnv('COOKIE_SECURE') === 'true',
  cookieSameSite: readEnv('COOKIE_SAME_SITE', 'Lax'),
  guestModeEnabled: false,
};
