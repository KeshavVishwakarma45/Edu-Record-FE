import { api, inInstitute, unwrap } from './client';

// Bulk student import (STU-04). The server reads and checks the Excel file.
export const studentImportApi = {
  // -> the template as a Blob (.xlsx)
  downloadTemplate: () =>
    api.get('/students/import-template', { responseType: 'blob' }).then((res) => res.data),

  // file: the chosen .xlsx File
  // -> { totalRows, imported, failed, errors: [{ row, messages }] }
  importFile: (file, instituteId) => {
    const body = new FormData();
    body.append('file', file);
    return api.post('/students/import', body, inInstitute(instituteId)).then(unwrap);
  },
};
