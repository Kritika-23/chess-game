const { AppError } = require('./errors');

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function requireString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string' || value.trim().length < min) {
    throw new AppError(`${field} is required`);
  }

  if (value.trim().length > max) {
    throw new AppError(`${field} must be ${max} characters or less`);
  }

  return value.trim();
}

function requireSafeString(value, field, options) {
  return escapeHtml(requireString(value, field, options));
}

function validateEmail(email) {
  const normalizedEmail = requireString(email, 'Email', { min: 3, max: 320 }).toLowerCase();
  const emailPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
  if (!emailPattern.test(normalizedEmail)) {
    throw new AppError('Email is invalid');
  }

  return normalizedEmail;
}

function validatePassword(password, field = 'Password') {
  const value = requireString(password, field, { min: 8, max: 128 });
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    throw new AppError(`${field} must include at least one letter and one number`);
  }

  return value;
}

function validateOptionalUrl(url, field = 'URL') {
  const value = requireString(url, field, { min: 0, max: 500 });
  if (!value) return '';

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Unsupported protocol');
    }
    return parsed.toString();
  } catch (error) {
    throw new AppError(`${field} must be a valid http or https URL`);
  }
}

module.exports = {
  escapeHtml,
  requireString,
  requireSafeString,
  validateEmail,
  validatePassword,
  validateOptionalUrl,
};
