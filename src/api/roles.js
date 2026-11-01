import { api, inInstitute, unwrap, unwrapList } from './client';

// Roles of the selected institute (or of its unit when institutes are combined).
// instituteId (optional): an institute of the role's owner; see inInstitute in client.js.
export const rolesApi = {
  // rows also carry ownerName and ownerInstituteId (which institute / unit owns the role)
  list: (params) => api.get('/roles', { params }).then(unwrapList),
  // The built-in roles, offered as a starting point: [{ name, description, permissions }]
  templates: () => api.get('/roles/templates').then(unwrap),
  create: (data, instituteId) => api.post('/roles', data, inInstitute(instituteId)).then(unwrap),
  update: (id, data, instituteId) =>
    api.patch(`/roles/${id}`, data, inInstitute(instituteId)).then(unwrap),
  remove: (id, instituteId) => api.delete(`/roles/${id}`, inInstitute(instituteId)).then(unwrap),
};
