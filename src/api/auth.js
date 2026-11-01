import { api, unwrap, refreshAccessToken } from './client';

export const authApi = {
  // -> { accessToken, user, institutes }
  login: (mobile, password) => api.post('/auth/login', { mobile, password }).then(unwrap),
  // -> new access token (uses the httpOnly refresh cookie)
  refresh: refreshAccessToken,
  logout: () => api.post('/auth/logout').then(unwrap),
  // -> { user, institutes: [{ id, name, shortCode, role, departmentId }] }
  me: () => api.get('/auth/me').then(unwrap),
};
