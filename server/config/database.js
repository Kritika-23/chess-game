const fs = require('fs');
const path = require('path');
const env = require('./env');
const logger = require('../utils/logger');

const dataDir = path.resolve(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'db.json');

const connection = {
  type: env.databaseUrl ? 'external' : 'file',
  url: env.databaseUrl,
  connected: false,
  data: {
    users: [],
    refreshTokens: [],
    emailVerificationTokens: [],
    passwordResetTokens: [],
    rooms: [],
    invites: [],
    statistics: [],
  },
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(connection.data, null, 2));
  }
}

function readDatabase() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, 'utf8');
  const parsed = raw ? JSON.parse(raw) : {};
  connection.data = {
    users: parsed.users || [],
    refreshTokens: parsed.refreshTokens || [],
    emailVerificationTokens: parsed.emailVerificationTokens || [],
    passwordResetTokens: parsed.passwordResetTokens || [],
    rooms: parsed.rooms || [],
    invites: parsed.invites || [],
    statistics: parsed.statistics || [],
  };
}

function writeDatabase() {
  ensureDataFile();
  fs.writeFileSync(dataFile, JSON.stringify(connection.data, null, 2));
}

async function connectDatabase() {
  try {
    readDatabase();
    connection.connected = true;
    logger.info(`Database connection ready (${connection.type})`);
    return connection;
  } catch (error) {
    logger.error('Database connection failed', error);
    throw error;
  }
}

function getCollection(name) {
  if (!connection.data[name]) {
    connection.data[name] = [];
  }

  return connection.data[name];
}

function saveDatabase() {
  writeDatabase();
}

module.exports = {
  connectDatabase,
  connection,
  getCollection,
  saveDatabase,
};
