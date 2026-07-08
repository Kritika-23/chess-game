const { v4: uuidv4 } = require('uuid');

function createUser({ email, passwordHash, name }) {
  const now = new Date().toISOString();

return {
  id: uuidv4(),
  email,
  passwordHash,
  name,

  username: "",
  bio: "",
  country: "",
  gender: "",
  dateOfBirth: "",
  avatarUrl: "",

  role: "player",
  emailVerified: false,

  rating: 1200,

  stats: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  },

  createdAt: now,
  updatedAt: now,
};
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

module.exports = {
  createUser,
  sanitizeUser,
};
