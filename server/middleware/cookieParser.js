const { parseCookies } = require('../utils/cookies');

module.exports = function cookieParser(req, res, next) {
  req.cookies = parseCookies(req.headers.cookie || '');
  next();
};
