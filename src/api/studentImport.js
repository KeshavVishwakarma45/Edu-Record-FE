import { api, inInstitute, unwrap } from './client';

// Bulk add of students (SRS STU-04). The address and body are agreed with the backend team.
// students: [{ scholarNo, ..., courseId }] -> { created, errors: [{ index, field, message }] }
// index = position in the students array, so the page can show the Excel row of a failed student.
export const studentImportApi = {
  importStudents: (students, instituteId) =>
    api.post('/students/bulk', { students }, inInstitute(instituteId)).then(unwrap),
};
