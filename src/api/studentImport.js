import { api, inInstitute, unwrap } from './client';

export const studentImportApi = {
  downloadTemplate: (instituteId) =>
    api
      .get('/students/import-template', {
        ...inInstitute(instituteId),
        responseType: 'blob',
      })
      .then((response) => response.data),

  importStudents: (file, instituteId) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/students/import', formData, inInstitute(instituteId)).then(unwrap);
  },
};
