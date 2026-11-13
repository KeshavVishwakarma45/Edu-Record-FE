import { GENDER_LIST } from '@/constants/genders';
import { CATEGORY_LIST } from '@/constants/categories';

// The columns of the Excel template. `header` is the text in row 1 of the sheet.
// text: true keeps leading zeros (scholar no., mobile); date: true means dd/mm/yyyy.
export const STUDENT_COLUMNS = [
  { key: 'scholarNo', header: 'Scholar No', required: true, text: true },
  { key: 'enrollmentNo', header: 'Enrollment No', text: true },
  { key: 'rollNo', header: 'Roll No', text: true },
  { key: 'name', header: 'Name', required: true },
  { key: 'fatherName', header: 'Father Name', required: true },
  { key: 'motherName', header: 'Mother Name' },
  { key: 'dob', header: 'DOB', required: true, date: true },
  { key: 'gender', header: 'Gender', required: true },
  { key: 'category', header: 'Category', required: true },
  { key: 'religion', header: 'Religion' },
  { key: 'address', header: 'Address' },
  { key: 'mobile', header: 'Mobile', text: true },
  { key: 'admissionDate', header: 'Admission Date', required: true, date: true },
  { key: 'courseShortCode', header: 'Course Short Code', required: true },
  { key: 'branch', header: 'Branch' },
  { key: 'batch', header: 'Batch', text: true },
  { key: 'previousSchool', header: 'Previous School' },
];

const MAX_ROWS = 500;
const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// exceljs is big, so it loads only when someone uses bulk add
async function loadExcelJs() {
  const module = await import('exceljs');
  return module.default ?? module;
}

const normalise = (text) => String(text).trim().toLowerCase();
const pad = (number) => String(number).padStart(2, '0');
const asText = (value) => (value instanceof Date ? '' : String(value).trim());

// ---- Template ---------------------------------------------------------------------------

export async function downloadStudentTemplate() {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet('Students');
  sheet.columns = STUDENT_COLUMNS.map((column) => ({
    header: column.header,
    key: column.key,
    width: Math.max(column.header.length + 4, 16),
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  STUDENT_COLUMNS.forEach((column, index) => {
    if (column.text) sheet.getColumn(index + 1).numFmt = '@';
    if (column.date) sheet.getColumn(index + 1).numFmt = 'dd/mm/yyyy';
  });

  // Dropdowns for Gender and Category, so clerks cannot mistype them
  const dropdowns = { gender: GENDER_LIST, category: CATEGORY_LIST };
  STUDENT_COLUMNS.forEach((column, index) => {
    const list = dropdowns[column.key];
    if (!list) return;
    for (let row = 2; row <= MAX_ROWS + 1; row += 1) {
      sheet.getCell(row, index + 1).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${list.join(',')}"`],
      };
    }
  });

  const help = workbook.addWorksheet('Instructions');
  help.getColumn(1).width = 100;
  const required = STUDENT_COLUMNS.filter((c) => c.required).map((c) => c.header);
  [
    'Fill the "Students" sheet, one student per row. Do not rename or remove the columns.',
    `Required columns: ${required.join(', ')}.`,
    'Dates: DD/MM/YYYY, for example 15/03/2005.',
    `Gender: ${GENDER_LIST.join(', ')}. Category: ${CATEGORY_LIST.join(', ')}.`,
    'Course Short Code and Branch must match a course already added for this institute (leave Branch empty if the course has no branch).',
    `At most ${MAX_ROWS} students per file.`,
  ].forEach((line) => help.addRow([line]));

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], { type: XLSX_TYPE }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'student-import-template.xlsx';
  link.click();
  URL.revokeObjectURL(url);
}

// ---- Reading the file -------------------------------------------------------------------

// A cell can hold text, a number, a date, rich text or a formula: turn it into text (or a Date)
function readCell(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'object') {
    if (value.richText)
      return value.richText
        .map((part) => part.text)
        .join('')
        .trim();
    if ('result' in value) return readCell(value.result);
    if ('text' in value) return String(value.text).trim();
    return '';
  }
  return String(value).trim();
}

// -> [{ row: <Excel row number>, raw: { scholarNo, name, ... } }]
export async function readStudentRows(file) {
  const ExcelJS = await loadExcelJs();
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(await file.arrayBuffer());
  } catch {
    throw new Error('This is not a valid .xlsx file. Please use the template.');
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The file has no sheet');

  // Find each column by its header text, so the column order does not matter
  const columnNumbers = {};
  sheet.getRow(1).eachCell((cell, columnNumber) => {
    columnNumbers[normalise(readCell(cell.value))] = columnNumber;
  });
  const missing = STUDENT_COLUMNS.filter(
    (column) => column.required && !columnNumbers[normalise(column.header)],
  ).map((column) => column.header);
  if (missing.length > 0) {
    throw new Error(`Missing column(s): ${missing.join(', ')}. Please use the template.`);
  }

  const rows = [];
  sheet.eachRow((excelRow, rowNumber) => {
    if (rowNumber === 1) return;
    const raw = {};
    let hasData = false;
    STUDENT_COLUMNS.forEach((column) => {
      const columnNumber = columnNumbers[normalise(column.header)];
      const value = columnNumber ? readCell(excelRow.getCell(columnNumber).value) : '';
      raw[column.key] = value;
      if (value !== '') hasData = true;
    });
    if (hasData) rows.push({ row: rowNumber, raw }); // fully empty rows are skipped
  });

  if (rows.length === 0) throw new Error('No student rows found in the file');
  if (rows.length > MAX_ROWS)
    throw new Error(`Too many rows. Upload at most ${MAX_ROWS} at a time.`);
  return rows;
}

// ---- Checking the rows ------------------------------------------------------------------

// Excel date cell, '15/03/2005' or '2005-03-15' -> '2005-03-15' (or null when it is not a real date)
function toIsoDate(value) {
  let year;
  let month;
  let day;
  if (value instanceof Date) {
    year = value.getUTCFullYear();
    month = value.getUTCMonth() + 1;
    day = value.getUTCDate();
  } else {
    const text = String(value).trim();
    const dmy = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dmy) {
      day = Number(dmy[1]);
      month = Number(dmy[2]);
      year = Number(dmy[3]);
    } else if (ymd) {
      year = Number(ymd[1]);
      month = Number(ymd[2]);
      day = Number(ymd[3]);
    } else {
      return null;
    }
  }
  const check = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    check.getUTCFullYear() === year &&
    check.getUTCMonth() === month - 1 &&
    check.getUTCDate() === day;
  return isReal ? `${year}-${pad(month)}-${pad(day)}` : null;
}

// rows: from readStudentRows. courses: the institute's courses (each with _id, shortCode, branch).
// A row with ANY error is not sent at all (SRS STU-04).
// -> { valid: [{ row, data }], errors: [{ row, field, message }] }
export function validateStudentRows(rows, courses) {
  const valid = [];
  const errors = [];
  const scholarRows = new Map();
  const enrollmentRows = new Map();
  const today = new Date().toISOString().slice(0, 10);

  rows.forEach(({ row, raw }) => {
    const rowErrors = [];
    const fail = (field, message) => rowErrors.push({ row, field, message });
    const text = (key) => asText(raw[key]);

    STUDENT_COLUMNS.forEach((column) => {
      if (column.required && raw[column.key] === '')
        fail(column.key, `${column.header} is required`);
    });

    const gender = GENDER_LIST.find((g) => normalise(g) === normalise(text('gender')));
    if (raw.gender !== '' && !gender) fail('gender', `Gender must be ${GENDER_LIST.join(', ')}`);
    const category = CATEGORY_LIST.find((c) => normalise(c) === normalise(text('category')));
    if (raw.category !== '' && !category) {
      fail('category', `Category must be ${CATEGORY_LIST.join(', ')}`);
    }

    const dob = raw.dob === '' ? null : toIsoDate(raw.dob);
    if (raw.dob !== '' && !dob) fail('dob', 'DOB must be a date like 15/03/2005');
    if (dob && dob >= today) fail('dob', 'DOB must be in the past');
    const admissionDate = raw.admissionDate === '' ? null : toIsoDate(raw.admissionDate);
    if (raw.admissionDate !== '' && !admissionDate) {
      fail('admissionDate', 'Admission Date must be a date like 15/07/2024');
    }

    if (text('mobile') && !MOBILE_PATTERN.test(text('mobile'))) {
      fail('mobile', 'Enter a 10-digit mobile number');
    }

    const course = courses.find(
      (c) =>
        normalise(c.shortCode) === normalise(text('courseShortCode')) &&
        normalise(c.branch ?? '') === normalise(text('branch')),
    );
    if (text('courseShortCode') && !course) {
      fail('courseShortCode', 'No course with this short code and branch in this institute');
    }

    // The same number twice inside the file
    const scholarKey = normalise(text('scholarNo'));
    if (scholarKey) {
      if (scholarRows.has(scholarKey)) {
        fail('scholarNo', `Scholar No is repeated (also in row ${scholarRows.get(scholarKey)})`);
      } else {
        scholarRows.set(scholarKey, row);
      }
    }
    const enrollmentKey = normalise(text('enrollmentNo'));
    if (enrollmentKey) {
      if (enrollmentRows.has(enrollmentKey)) {
        fail(
          'enrollmentNo',
          `Enrollment No is repeated (also in row ${enrollmentRows.get(enrollmentKey)})`,
        );
      } else {
        enrollmentRows.set(enrollmentKey, row);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    valid.push({
      row,
      data: {
        scholarNo: text('scholarNo'),
        enrollmentNo: text('enrollmentNo') || null, // the server wants null, never ''
        rollNo: text('rollNo'),
        name: text('name'),
        fatherName: text('fatherName'),
        motherName: text('motherName'),
        dob,
        gender,
        category,
        religion: text('religion'),
        address: text('address'),
        mobile: text('mobile'),
        admissionDate,
        courseId: course._id,
        branch: course.branch ?? '',
        batch: text('batch'),
        previousSchool: text('previousSchool'),
      },
    });
  });

  return { valid, errors };
}
