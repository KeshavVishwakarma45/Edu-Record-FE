import { api, unwrap, unwrapList } from './client';

// EXAMPLE API FILE: one file per module, one function per endpoint.
// Copy it for a new module and change the URL.
export const coursesApi = {
  // params: { page, limit, sort, search } -> { rows, total }
  list: (params) => api.get('/courses', { params }).then(unwrapList),
  get: (id) => api.get(`/courses/${id}`).then(unwrap),
  create: (data) => api.post('/courses', data).then(unwrap),
  update: (id, data) => api.patch(`/courses/${id}`, data).then(unwrap),
  remove: (id) => api.delete(`/courses/${id}`).then(unwrap),
  // Choices for the form: { affiliations: [{ value, label }] }
  options: () => api.get('/courses/options').then(unwrap),
};
