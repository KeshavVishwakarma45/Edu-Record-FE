import { api, inInstitute, unwrap, unwrapList } from './client';

export const tcsApi = {
  list: (params) => api.get('/tcs', { params }).then(unwrapList),

  getEligibility: (studentId, instituteId) =>
    api.get(`/students/${studentId}/tc-eligibility`, inInstitute(instituteId)).then(unwrap),

  getTCData: (studentId, instituteId) =>
    api.get(`/students/${studentId}/tc-data`, inInstitute(instituteId)).then(unwrap),

  create: (data, instituteId) => api.post('/tcs', data, inInstitute(instituteId)).then(unwrap),

  getById: (id, instituteId) => api.get(`/tcs/${id}`, inInstitute(instituteId)).then(unwrap),

  update: (id, data, instituteId) =>
    api.patch(`/tcs/${id}`, data, inInstitute(instituteId)).then(unwrap),

  submit: (id, instituteId) =>
    api.post(`/tcs/${id}/submit`, {}, inInstitute(instituteId)).then(unwrap),

  approve: (id, instituteId) =>
    api.post(`/tcs/${id}/approve`, {}, inInstitute(instituteId)).then(unwrap),

  reject: (id, rejectionReason, instituteId) =>
    api.post(`/tcs/${id}/reject`, { rejectionReason }, inInstitute(instituteId)).then(unwrap),

  issue: (id, data, instituteId) => {
    const formData = new FormData();
    formData.append('receivedBy', data.receivedBy);
    formData.append('handoverPhoto', data.handoverPhoto);
    formData.append('receiverSignature', data.receiverSignature);

    return api.post(`/tcs/${id}/issue`, formData, inInstitute(instituteId)).then(unwrap);
  },

  getPdf: (id, instituteId) =>
    api
      .get(`/tcs/${id}/pdf`, {
        ...inInstitute(instituteId),
        responseType: 'blob',
      })
      .then((response) => response.data),

  history: (id, instituteId) =>
    api.get(`/tcs/${id}/history`, inInstitute(instituteId)).then(unwrap),
};
