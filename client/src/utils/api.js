const apiHost = typeof window !== 'undefined' && window.location.hostname
  ? window.location.hostname
  : 'localhost';
const SERVER_URL = process.env.REACT_APP_SERVER_URL || `http://${apiHost}:3001`;
let cachedCsrfToken = '';
let refreshPromise = null;

const SKIP_REFRESH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/password/forgot',
  '/api/auth/password/reset',
]);

function isUsableCsrfToken(token) {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const expiresAt = Number(parts[1]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}
function clearLocalCsrfCookie() {
  document.cookie = 'csrfToken=; Max-Age=0; Path=/';
}

function getCookie(name) {
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=') || '';
}

export async function ensureCsrfToken() {
  const existing = getCookie('csrfToken');
  if (isUsableCsrfToken(existing)) {
    cachedCsrfToken = decodeURIComponent(existing);
    return cachedCsrfToken;
  }

  if (existing) clearLocalCsrfCookie();

  if (isUsableCsrfToken(cachedCsrfToken)) return cachedCsrfToken;

  const response = await fetch(`${SERVER_URL}/api/auth/csrf`, {
    credentials: 'include',
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.error || 'Unable to initialize security token');
  }

  cachedCsrfToken = data.csrfToken;
  return cachedCsrfToken;
}
function isInvalidCsrfResponse(response) {
  return response.status === 403;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const csrfToken = await ensureCsrfToken();

      const response = await fetch(`${SERVER_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'x-csrf-token': csrfToken,
        },
      });

      if (!response.ok) {
        throw new Error('Session expired');
      }

      cachedCsrfToken = '';
      await ensureCsrfToken();

      return response;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function readErrorMessage(response) {
  const clone = response.clone();
  const data = await parseJsonResponse(clone);
  return data.error || '';
}

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const needsCsrf = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  if (needsCsrf) {
    headers.set('x-csrf-token', await ensureCsrfToken());
  }

  const request = {
    ...options,
    method,
    headers,
    credentials: 'include',
  };
  let response = await fetch(`${SERVER_URL}${path}`, request);

  if (needsCsrf && isInvalidCsrfResponse(response)) {
    const errorMessage = await readErrorMessage(response);

    if (errorMessage === 'Invalid CSRF token') {
      cachedCsrfToken = '';
      clearLocalCsrfCookie();
      headers.set('x-csrf-token', await ensureCsrfToken());
      response = await fetch(`${SERVER_URL}${path}`, request);
    }
  }

  if (response.status === 401 && !SKIP_REFRESH_PATHS.has(path)) {
    try {
      await refreshSession();

      if (needsCsrf) {
        headers.set('x-csrf-token', await ensureCsrfToken());
      }

      response = await fetch(`${SERVER_URL}${path}`, request);
    } catch {
      window.dispatchEvent(new Event('auth:session-expired'));
    }
  }

  return response;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function readJsonResponse(response) {
  if (response.status === 204) return null;

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

export { SERVER_URL };
