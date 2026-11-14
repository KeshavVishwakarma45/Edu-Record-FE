import { api, inInstitute, unwrapList, unwrap } from './client';

export const studentsApi = {
  list: (params) => api.get('/students', { params }).then(unwrapList),

  getById: (id) => api.get(`/students/${id}`).then(unwrap),

  create: (data, instituteId) => api.post('/students', data, inInstitute(instituteId)).then(unwrap),

  uploadPhoto: (id, file, instituteId) => {
    const formData = new FormData();
    formData.append('photo', file);

    return api.patch(`/students/${id}/photo`, formData, inInstitute(instituteId)).then(unwrap);
  },

  getPhoto: (fileId, instituteId) =>
    api
      .get(`/files/${fileId}`, {
        ...inInstitute(instituteId),
        responseType: 'blob',
      })
      .then((response) => response.data),
};
