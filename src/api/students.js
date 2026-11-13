import { api, inInstitute, unwrapList, unwrap } from './client';

export const studentsApi = {
  list: (params) => api.get('/students', { params }).then(unwrapList),

  getById: (id) => api.get(`/students/${id}`).then(unwrap),

  create: (data, instituteId) => api.post('/students', data, inInstitute(instituteId)).then(unwrap),
};
