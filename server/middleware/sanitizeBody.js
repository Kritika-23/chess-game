const dangerousKeys = new Set(['__proto__', 'prototype', 'constructor']);

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value).reduce((result, key) => {
    if (dangerousKeys.has(key)) return result;
    result[key] = sanitizeValue(value[key]);
    return result;
  }, {});
}

module.exports = function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  next();
};
