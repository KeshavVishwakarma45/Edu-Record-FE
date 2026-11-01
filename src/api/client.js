import axios from 'axios';

// The ONE axios instance for the whole app. Pages never import axios: they call a file in api/.
//
// It does three jobs so no page has to:
//   1. adds "Authorization: Bearer <token>" and "X-Institute-Id" to every request
//   2. on a 401, gets a new access token once (POST /auth/refresh) and retries the request
//   3. turns every failure into { status, code, message, details } (the server's error format)

const baseURL = import.meta.env.VITE_API_URL;

// Kept in memory only (never localStorage), so other scripts on the page cannot steal it.
// AuthContext sets these values.
let accessToken = null;
let instituteId = null;
let onSessionExpired = () => {};

export function setAccessToken(token) {
  accessToken = token;
}
export function setInstituteId(id) {
  instituteId = id;
}
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

export const api = axios.create({ baseURL, withCredentials: true }); // withCredentials sends the refresh cookie

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  // A request sent with inInstitute(id) keeps its own institute
  if (instituteId && !config.headers['X-Institute-Id']) {
    config.headers['X-Institute-Id'] = instituteId;
  }
  return config;
});

// The Super Admin's "All institutes" view: lists show every institute, but every change goes to
// one institute. API functions take an optional instituteId and pass it on with inInstitute():
//   update: (id, data, instituteId) => api.patch(`/courses/${id}`, data, inInstitute(instituteId))
// Without an id the request goes to the selected institute, as usual.
export const ALL_INSTITUTES = 'all';
export const inInstitute = (id) => (id ? { headers: { 'X-Institute-Id': id } } : {});

// If five requests fail with 401 at the same time, they all wait for this ONE refresh call
let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    // Plain axios (not `api`), so a failed refresh cannot trigger another refresh
    refreshPromise = axios
      .post(`${baseURL}/auth/refresh`, null, { withCredentials: true })
      .then((res) => {
        accessToken = res.data.data.accessToken;
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function toApiError(error) {
  const status = error.response?.status ?? 0;
  const body = error.response?.data?.error;
  if (body) return { status, code: body.code, message: body.message, details: body.details ?? [] };
  if (status)
    return { status, code: 'HTTP_ERROR', message: `Request failed (${status})`, details: [] };
  return {
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Cannot reach the server. Check your connection and try again.',
    details: [],
  };
}

const AUTH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/setup'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      original &&
      !original.retried &&
      !AUTH_URLS.some((url) => original.url?.includes(url));

    if (shouldRefresh) {
      original.retried = true;
      try {
        await refreshAccessToken();
        return api(original); // the request interceptor adds the new token
      } catch {
        accessToken = null;
        onSessionExpired(); // AuthContext clears the user and goes to /login
      }
    }
    return Promise.reject(toApiError(error));
  },
);

// Every API file returns plain data, never the axios response:
//   unwrap     -> the "data" of { success, data }
//   unwrapList -> { rows, total } from { success, data, meta }
export const unwrap = (response) => response.data.data;
export const unwrapList = (response) => ({
  rows: response.data.data,
  total: response.data.meta.total,
});
