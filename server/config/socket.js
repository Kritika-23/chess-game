const env = require('./env');

module.exports = {
  cors: {
    origin: env.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
};
