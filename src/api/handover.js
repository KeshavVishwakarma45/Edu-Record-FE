import { api, inInstitute, unwrap } from './client';

export const handoverApi = {
  listDocuments: (studentId, instituteId) =>
    api
      .get(`/handover/students/${studentId}/documents`, inInstitute(instituteId))
      .then((response) => {
        const data = unwrap(response);
        const rows = Array.isArray(data?.documents) ? data.documents : [];

        return {
          rows,
          total: rows.length,
        };
      }),

  uploadSignature: (studentId, file, instituteId) => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('signature', file);

    return api.post('/handover/upload-signature', formData, inInstitute(instituteId)).then(unwrap);
  },

  uploadPhoto: (studentId, file, instituteId) => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('photo', file);

    return api.post('/handover/upload-photo', formData, inInstitute(instituteId)).then(unwrap);
  },

  getHistory: (params = {}, instituteId) => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== '' && value !== null && value !== undefined,
      ),
    );

    return api
      .get('/handover/history', {
        params: filteredParams,
        ...inInstitute(instituteId),
      })
      .then((response) => {
        const data = response.data.data;
        const meta = response.data.meta;

        return {
          rows: Array.isArray(data) ? data : [],
          page: meta?.page ?? 1,
          limit: meta?.limit ?? 20,
          total: meta?.total ?? 0,
        };
      });
  },

  create: (data, instituteId) => api.post('/handover', data, inInstitute(instituteId)).then(unwrap),
};
