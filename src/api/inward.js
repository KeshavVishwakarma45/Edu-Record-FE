import { api, inInstitute, unwrap, unwrapList } from './client';

export const inwardApi = {
  create: (data, instituteId) =>
    api.post('/inward-batches', data, inInstitute(instituteId)).then(unwrap),

  list: (params, instituteId) =>
    api.get('/inward-batches', { ...inInstitute(instituteId), params }).then(unwrapList),

  get: (id, instituteId) => api.get(`/inward-batches/${id}`, inInstitute(instituteId)).then(unwrap),

  getCounts: (id, instituteId) =>
    api.get(`/inward-batches/${id}/counts`, inInstitute(instituteId)).then(unwrap),

  getStudents: (batchId, instituteId) =>
    api.get(`/inward-batches/${batchId}/students`, inInstitute(instituteId)).then(unwrap),

  receive: (batchId, data, instituteId) =>
    api.post(`/inward-batches/${batchId}/receipts`, data, inInstitute(instituteId)).then(unwrap),

  updateReceipt: (batchId, receiptId, data, instituteId) =>
    api
      .patch(`/inward-batches/${batchId}/receipts/${receiptId}`, data, inInstitute(instituteId))
      .then(unwrap),

  receiveMissing: (batchId, missingId, data, instituteId) =>
    api
      .post(
        `/inward-batches/${batchId}/missing/${missingId}/receive`,
        data,
        inInstitute(instituteId),
      )
      .then(unwrap),

  markMissing: (batchId, data, instituteId) =>
    api.post(`/inward-batches/${batchId}/missing`, data, inInstitute(instituteId)).then(unwrap),

  getMissing: (batchId, instituteId) =>
    api.get(`/inward-batches/${batchId}/missing`, inInstitute(instituteId)).then(unwrap),

  updateMissing: (batchId, missingId, data, instituteId) =>
    api
      .patch(`/inward-batches/${batchId}/missing/${missingId}`, data, inInstitute(instituteId))
      .then(unwrap),

  getPending: (params, instituteId) =>
    api.get('/inward-pending', { ...inInstitute(instituteId), params }).then(unwrapList),
};
