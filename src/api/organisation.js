import { api, inInstitute, unwrap } from './client';

// Super Admin only: institutes, units, combine and separate (ADR-016).
// Asset bytes continue to use the private Files module; these helpers only call its scoped routes.
export const organisationApi = {
  overview: () => api.get('/organisation').then(unwrap),
  universities: () => api.get('/organisation/universities').then(unwrap),

  createInstitute: (data) => api.post('/organisation/institutes', data).then(unwrap),
  updateInstitute: (id, data) => api.patch(`/organisation/institutes/${id}`, data).then(unwrap),

  uploadInstituteAsset: (id, asset, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/organisation/institutes/${id}/assets/${asset}`, formData).then(unwrap);
  },
  removeInstituteAsset: (id, asset) =>
    api.delete(`/organisation/institutes/${id}/assets/${asset}`).then(unwrap),
  getFile: (fileId, instituteId) =>
    api
      .get(`/files/${fileId}`, {
        ...inInstitute(instituteId),
        responseType: 'blob',
      })
      .then((response) => response.data),

  departments: (instituteId) =>
    api.get(`/organisation/institutes/${instituteId}/departments`).then(unwrap),
  createDepartment: (instituteId, data) =>
    api.post(`/organisation/institutes/${instituteId}/departments`, data).then(unwrap),
  updateDepartment: (instituteId, departmentId, data) =>
    api
      .patch(`/organisation/institutes/${instituteId}/departments/${departmentId}`, data)
      .then(unwrap),
  deleteDepartment: (instituteId, departmentId) =>
    api.delete(`/organisation/institutes/${instituteId}/departments/${departmentId}`).then(unwrap),

  previewCombine: (data) => api.post('/organisation/units/preview', data).then(unwrap),
  combine: (data) => api.post('/organisation/units', data).then(unwrap),
  renameUnit: (unitId, name) => api.patch(`/organisation/units/${unitId}`, { name }).then(unwrap),
  previewJoin: (unitId, instituteId) =>
    api.post(`/organisation/units/${unitId}/join/preview`, { instituteId }).then(unwrap),
  join: (unitId, instituteId) =>
    api.post(`/organisation/units/${unitId}/join`, { instituteId }).then(unwrap),
  removeInstitute: (unitId, instituteId) =>
    api.post(`/organisation/units/${unitId}/remove`, { instituteId }).then(unwrap),
  separate: (unitId) => api.post(`/organisation/units/${unitId}/separate`).then(unwrap),
};
