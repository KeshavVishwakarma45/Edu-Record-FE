import { api, inInstitute, unwrap, unwrapList } from './client';

// EXAMPLE API FILE: one file per module, one function per endpoint.
// Copy it for a new module and change the URL.
//
// instituteId (optional): which institute the change is for. Pages pass the record's own
// institute, so changes also work in the Super Admin's "All institutes" view.
export const coursesApi = {
  // params: { page, limit, sort, search, instituteId? } -> { rows, total }
  list: (params) => api.get('/courses', { params }).then(unwrapList),
  get: (id) => api.get(`/courses/${id}`).then(unwrap),
  create: (data, instituteId) => api.post('/courses', data, inInstitute(instituteId)).then(unwrap),
  update: (id, data, instituteId) =>
    api.patch(`/courses/${id}`, data, inInstitute(instituteId)).then(unwrap),
  remove: (id, instituteId) => api.delete(`/courses/${id}`, inInstitute(instituteId)).then(unwrap),
  // Choices for the form: { affiliations: [{ value, label }] }
  options: (instituteId) => api.get('/courses/options', inInstitute(instituteId)).then(unwrap),
};
