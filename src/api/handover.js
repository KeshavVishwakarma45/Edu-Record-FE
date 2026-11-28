import { api, inInstitute, unwrap, unwrapList } from './client';

export const handoverApi = {
  // Get all documents belonging to a student
  listStudentDocuments: (studentId, instituteId) =>
    api.get(`/handover/students/${studentId}/documents`, inInstitute(instituteId)).then(unwrap),

  // Upload receiver photo (JPG / PNG, max 2 MB)
  uploadReceiverPhoto: (studentId, file, instituteId) => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('photo', file);

    return api.post('/handover/upload-photo', formData, inInstitute(instituteId)).then(unwrap);
  },

  // Upload signed receipt / signature
  uploadSignature: (studentId, file, instituteId) => {
    const formData = new FormData();
    formData.append('studentId', studentId);
    formData.append('signature', file);

    return api.post('/handover/upload-signature', formData, inInstitute(instituteId)).then(unwrap);
  },

  // Submit final hand-over
  submit: (payload, instituteId) =>
    api.post('/handover', payload, inInstitute(instituteId)).then(unwrap),

  // Get hand-over history for a student
  listHistory: (studentId, instituteId) =>
    api
      .get('/handover/history', {
        ...inInstitute(instituteId),
        params: {
          studentId,
          page: 1,
          limit: 20,
        },
      })
      .then(unwrapList),
};
