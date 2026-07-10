const apiHost = typeof window !== 'undefined' && window.location.hostname
  ? window.location.hostname
  : 'localhost';
const SERVER_URL = process.env.REACT_APP_SERVER_URL || `http://${apiHost}:3001`;
let cachedCsrfToken = '';

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
  if (existing) {
    cachedCsrfToken = decodeURIComponent(existing);
    return cachedCsrfToken;
  }

  if (cachedCsrfToken) return cachedCsrfToken;

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

export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    headers.set('x-csrf-token', await ensureCsrfToken());
  }

  return fetch(`${SERVER_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });
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
