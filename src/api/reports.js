import { api, unwrap, unwrapList } from './client';

export const reportsApi = {
  // Get not-received documents
  notReceived: (params = {}) => api.get('/reports/not-received', { params }).then(unwrapList),

  // Update reason and follow-up date
  updateFollowUp: (id, payload) =>
    api.patch(`/reports/not-received/${id}/follow-up`, payload).then(unwrap),
};
