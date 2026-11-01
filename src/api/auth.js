import { api, unwrap, refreshAccessToken } from './client';

export const authApi = {
  // -> { accessToken, user, institutes }
  login: (email, password) => api.post('/auth/login', { email, password }).then(unwrap),
  // -> new access token (uses the httpOnly refresh cookie)
  refresh: refreshAccessToken,
  logout: () => api.post('/auth/logout').then(unwrap),
  // -> { user, institutes: [{ id, name, shortCode, role, departmentId }] }
  me: () => api.get('/auth/me').then(unwrap),
  // Invite / password links: who the link is for, then set the password (logs the person in)
  checkSetupLink: (token) => api.get(`/auth/setup/${token}`).then(unwrap),
  useSetupLink: (token, password) => api.post(`/auth/setup/${token}`, { password }).then(unwrap),
};
