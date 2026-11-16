import { api, unwrap, unwrapList } from './client';

export const inwardApi = {
  // 1. Create inward batch
  create: (data) => api.post('/inward-batches', data).then(unwrap),

  // 2. Get all inward batches
  list: (params) => api.get('/inward-batches', { params }).then(unwrapList),

  // 3. Get single batch details
  get: (id) => api.get(`/inward-batches/${id}`).then(unwrap),

  // 4. Get batch document counts
  getCounts: (id) => api.get(`/inward-batches/${id}/counts`).then(unwrap),

  // 5. Get students and expected documents
  getStudents: (batchId) => api.get(`/inward-batches/${batchId}/students`).then(unwrap),

  // 6. Receive an expected document
  receive: (batchId, data) => api.post(`/inward-batches/${batchId}/receipts`, data).then(unwrap),

  // 7. Update an existing receipt
  updateReceipt: (batchId, receiptId, data) =>
    api.patch(`/inward-batches/${batchId}/receipts/${receiptId}`, data).then(unwrap),

  // 8. Receive a previously missing document
  receiveMissing: (batchId, missingId, data) =>
    api.post(`/inward-batches/${batchId}/missing/${missingId}/receive`, data).then(unwrap),

  // 9. Mark an expected document as missing
  markMissing: (batchId, data) => api.post(`/inward-batches/${batchId}/missing`, data).then(unwrap),

  // 10. Get missing documents of a batch
  getMissing: (batchId) => api.get(`/inward-batches/${batchId}/missing`).then(unwrap),

  // 11. Update missing document details
  updateMissing: (batchId, missingId, data) =>
    api.patch(`/inward-batches/${batchId}/missing/${missingId}`, data).then(unwrap),

  // 12. Get all pending inward documents
  getPending: (params) => api.get('/inward-pending', { params }).then(unwrapList),
};
