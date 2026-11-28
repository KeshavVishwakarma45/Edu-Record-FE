import { api, inInstitute, unwrap, unwrapList } from './client';

export const resultsApi = {
  // Load course, exam term and exam session options
  options: (instituteId) => api.get('/results/options', inInstitute(instituteId)).then(unwrap),

  // Load eligible students for selected filters
  roster: (params, instituteId) =>
    api
      .get('/results/roster', {
        params,
        ...inInstitute(instituteId),
      })
      .then(unwrapList),

  // Get an existing result register
  getRegister: (id) => api.get(`/results/registers/${id}`).then(unwrap),

  // Create/save a result register
  createRegister: (data, instituteId) =>
    api.post('/results/registers', data, inInstitute(instituteId)).then(unwrap),

  // Update an existing result register
  updateRegister: (id, data, instituteId) =>
    api.patch(`/results/registers/${id}`, data, inInstitute(instituteId)).then(unwrap),
};
