const env = require('./env');

module.exports = {
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
};
