import { api, unwrap } from './client';

export const clearanceApi = {
  // Submit a new TC clearance application
  createApplication: (data) => api.post('/clearance/applications', data).then(unwrap),
};
