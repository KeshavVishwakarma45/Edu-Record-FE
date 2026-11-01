import { api, inInstitute, unwrap, unwrapList } from './client';

// Staff of the selected institute (or of its unit when institutes are combined).
// instituteId (optional): an institute of the owner the change is for; see inInstitute in client.js.
// In the Super Admin's "All institutes" view a user working in two places has two rows:
// row._id is unique per row, row.userId is the user.
export const usersApi = {
  // params: { page, limit, sort, search } -> { rows, total }
  list: (params) => api.get('/users', { params }).then(unwrapList),
  // Choices for the invite form: { roles: [{ value, label, permissions }], departments: [...] }
  options: (instituteId) => api.get('/users/options', inInstitute(instituteId)).then(unwrap),
  // -> { user, inviteLink, expiresAt }   inviteLink is null when the person already has an account
  invite: (data, instituteId) =>
    api.post('/users/invite', data, inInstitute(instituteId)).then(unwrap),
  setAccess: (id, data, instituteId) =>
    api.patch(`/users/${id}/access`, data, inInstitute(instituteId)).then(unwrap),
  removeAccess: (id, instituteId) =>
    api.delete(`/users/${id}/access`, inInstitute(instituteId)).then(unwrap),
  // A new invite link (invited user) or password reset link (active user) -> { link, expiresAt }
  setupLink: (id, instituteId) =>
    api.post(`/users/${id}/setup-link`, null, inInstitute(instituteId)).then(unwrap),
  disable: (id, instituteId) =>
    api.post(`/users/${id}/disable`, null, inInstitute(instituteId)).then(unwrap),
  enable: (id, instituteId) =>
    api.post(`/users/${id}/enable`, null, inInstitute(instituteId)).then(unwrap),
};
