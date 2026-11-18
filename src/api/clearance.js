import { api, unwrap, unwrapList } from './client';

export const clearanceApi = {
  // TC applications
  createApplication: (data) => api.post('/clearance/applications', data).then(unwrap),

  listApplications: (params) => api.get('/clearance/applications', { params }).then(unwrapList),

  // Department in-charge queue
  getQueue: (params) => api.get('/clearance/queue', { params }).then(unwrapList),

  updateItem: (itemId, data) => api.patch(`/clearance/items/${itemId}`, data).then(unwrap),

  // Student-wise clearance
  getStudentClearance: (studentId) => api.get(`/clearance/students/${studentId}`).then(unwrap),

  // Accounts pending dues
  getPendingDues: (params) =>
    api.get('/clearance/accounts/pending-dues', { params }).then(unwrapList),

  updateDues: (itemId, data) => api.patch(`/clearance/items/${itemId}/dues`, data).then(unwrap),
};
