import { api, inInstitute, unwrap, unwrapList } from './client';

export const dashboardApi = {
  getSummary: (instituteId) => api.get('/dashboard/summary', inInstitute(instituteId)).then(unwrap),

  getAttention: (params = {}, instituteId) =>
    api
      .get('/dashboard/attention', {
        ...inInstitute(instituteId),
        params,
      })
      .then(unwrap),

  getRecentInward: (params = {}, instituteId) =>
    api
      .get('/dashboard/recent-inward', {
        ...inInstitute(instituteId),
        params,
      })
      .then(unwrapList),

  getRecentTCs: (params = {}, instituteId) =>
    api
      .get('/dashboard/recent-tcs', {
        ...inInstitute(instituteId),
        params,
      })
      .then(unwrapList),
};
