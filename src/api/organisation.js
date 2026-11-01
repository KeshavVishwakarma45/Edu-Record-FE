import { api, unwrap } from './client';

// Super Admin only: institutes, units, combine and separate (ADR-016)
export const organisationApi = {
  // -> { institutes: [{ id, name, shortCode, address, website, principalName, universities,
  //                     unitId, roleCount?, userCount? }], units: [{ id, name, instituteIds, ... }] }
  overview: () => api.get('/organisation').then(unwrap),
  // Choices for the Add institute form: [{ value, label }]
  universities: () => api.get('/organisation/universities').then(unwrap),

  // Institutes. data: { name, shortCode, address, website, principalName,
  //                     universityId, affiliatedFrom, unitId (empty = separate), defaultDepartments,
  //                     roleTemplates: built-in role names a separate institute starts with }
  createInstitute: (data) => api.post('/organisation/institutes', data).then(unwrap),
  // The short code cannot be changed (it is printed in TC numbers)
  updateInstitute: (id, data) => api.patch(`/organisation/institutes/${id}`, data).then(unwrap),

  // Units. data: { name, instituteIds, keepRolesFrom: instituteId | 'template' }
  previewCombine: (data) => api.post('/organisation/units/preview', data).then(unwrap),
  combine: (data) => api.post('/organisation/units', data).then(unwrap),
  renameUnit: (unitId, name) => api.patch(`/organisation/units/${unitId}`, { name }).then(unwrap),
  previewJoin: (unitId, instituteId) =>
    api.post(`/organisation/units/${unitId}/join/preview`, { instituteId }).then(unwrap),
  join: (unitId, instituteId) =>
    api.post(`/organisation/units/${unitId}/join`, { instituteId }).then(unwrap),
  // -> { dissolved } true when only one institute was left, so the unit was separated
  removeInstitute: (unitId, instituteId) =>
    api.post(`/organisation/units/${unitId}/remove`, { instituteId }).then(unwrap),
  separate: (unitId) => api.post(`/organisation/units/${unitId}/separate`).then(unwrap),
};
