import { useEffect, useMemo, useState } from 'react';

import { useFormContext, useWatch } from 'react-hook-form';

import { useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';

import AddIcon from '@mui/icons-material/Add';

import SearchIcon from '@mui/icons-material/Search';

import CloseIcon from '@mui/icons-material/Close';

import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { useList } from '@/hooks/useList';

import { useAuth } from '@/hooks/useAuth';

import { useRequest } from '@/hooks/useRequest';

import { useNotify } from '@/hooks/useNotify';

import { coursesApi } from '@/api/courses';

import { studentsApi } from '@/api/students';

import { STUDENT_STATUS_LIST, STUDENT_STATUSES } from '@/constants/statuses';

import { GENDER_LIST } from '@/constants/genders';

import { CATEGORY_LIST } from '@/constants/categories';

import PageHeader from '@/components/PageHeader';

import FormDialog from '@/components/FormDialog';

import FormTextField from '@/components/form/FormTextField';

import FormDateField from '@/components/form/FormDateField';

import FormSelect from '@/components/form/FormSelect';

import FormPhotoUpload from '@/components/form/FormPhotoUpload';

import BulkImportButton from './BulkImportButton';

const EMPTY_ROWS = Object.freeze([]);

const genderOptions = GENDER_LIST.map((gender) => ({
  value: gender,

  label: gender,
}));

const categoryOptions = CATEGORY_LIST.map((category) => ({
  value: category,

  label: category,
}));

const RELIGION_OPTIONS = [
  { value: 'Hindu', label: 'Hindu' },

  { value: 'Muslim', label: 'Muslim' },

  { value: 'Christian', label: 'Christian' },

  { value: 'Sikh', label: 'Sikh' },

  { value: 'Buddhist', label: 'Buddhist' },

  { value: 'Jain', label: 'Jain' },

  { value: 'Other', label: 'Other' },
];

const validateNotBlank = (value) =>
  Boolean(String(value ?? '').trim()) || 'This field cannot be empty';

const validatePersonName = (value) => {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return 'Name is required';
  }

  return (
    /^[\p{L}\p{M}\s.'’-]+$/u.test(trimmedValue) ||
    'Only letters, spaces, dots, hyphens and apostrophes are allowed'
  );
};

const validateMobile = (value) => {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return 'Mobile no is required';
  }

  return /^[6-9]\d{9}$/.test(trimmedValue) || 'Enter a valid 10-digit Indian mobile number';
};

const validateAdmissionDate = (value, formValues) => {
  if (!value || !formValues.dob) {
    return true;
  }

  const admissionDate = dayjs(value);

  const dob = dayjs(formValues.dob);

  if (admissionDate.isBefore(dob, 'day')) {
    return 'Admission date cannot be before date of birth';
  }

  return true;
};

function StudentCourseField({ allInstitutes, selectedInstitute }) {
  const { setValue } = useFormContext();

  const selectedFormInstitute = useWatch({
    name: 'instituteId',
  });

  const instituteId = allInstitutes ? selectedFormInstitute : selectedInstitute?.id;

  const [loaded, setLoaded] = useState({
    instituteId: null,

    courses: [],

    error: false,
  });

  useEffect(() => {
    let ignore = false;

    setValue('courseId', '');

    if (!instituteId) {
      return undefined;
    }

    coursesApi

      .list(
        {
          page: 1,

          limit: 100,

          sort: 'name',
        },

        instituteId,
      )

      .then(({ rows: courseRows = [] }) => {
        if (!ignore) {
          setLoaded({
            instituteId,

            courses: courseRows,

            error: false,
          });
        }
      })

      .catch(() => {
        if (!ignore) {
          setLoaded({
            instituteId,

            courses: [],

            error: true,
          });
        }
      });

    return () => {
      ignore = true;
    };
  }, [instituteId, setValue]);

  const isCurrentInstituteLoaded = loaded.instituteId === instituteId;

  const loading = Boolean(instituteId) && !isCurrentInstituteLoaded;

  const error = isCurrentInstituteLoaded && loaded.error;

  const courses = isCurrentInstituteLoaded ? loaded.courses : [];

  const courseOptions = courses.map((course) => ({
    value: course._id,

    label: `${course.name} (${course.shortCode})`,
  }));

  return (
    <FormSelect
      name="courseId"

      label="Course"

      options={courseOptions}

      rules={{
        required: 'Please select a course',

        validate: (value) =>
          courseOptions.some((course) => course.value === value) || 'Please select a valid course',
      }}

      disabled={!instituteId || loading || error || courseOptions.length === 0}

      helperText={
        !instituteId
          ? 'Please select an institute first'
          : error
            ? 'Unable to load courses'
            : loading
              ? 'Loading courses...'
              : courseOptions.length === 0
                ? 'No courses available'
                : ''
      }

      fullWidth
    />
  );
}

export default function StudentsPage() {
  const { selectedInstitute, allInstitutes, realInstitutes } = useAuth();

  const notify = useNotify();

  const navigate = useNavigate();

  const { run: createStudent, loading: createLoading } = useRequest(studentsApi.create);

  const { run: uploadStudentPhoto, loading: photoUploadLoading } = useRequest(
    studentsApi.uploadPhoto,
  );

  const [open, setOpen] = useState(false);

  const [coursesResult, setCoursesResult] = useState({
    key: null,

    rows: [],
  });

  const [batchesResult, setBatchesResult] = useState({
    key: null,

    rows: [],
  });

  const {
    rows: studentRows,

    total: studentTotal,

    loading: studentsLoading,

    error: studentsError,

    params: tableParams,

    setParams: setTableParams,

    reload: reloadStudents,
  } = useList(studentsApi.list, {
    page: 1,

    limit: 25,

    sort: '-createdAt',

    search: '',

    courseId: '',

    batch: '',

    status: STUDENT_STATUSES.STUDYING,

    instituteId: '',
  });

  const coursesKey = JSON.stringify({
    allInstitutes,

    instituteId: tableParams.instituteId,

    selectedInstituteId: selectedInstitute?.id,
  });

  const batchesKey = JSON.stringify({
    allInstitutes,

    courseId: tableParams.courseId,

    instituteId: tableParams.instituteId,

    selectedInstituteId: selectedInstitute?.id,
  });

  const courses = coursesResult.key === coursesKey ? coursesResult.rows : EMPTY_ROWS;

  const batches = batchesResult.key === batchesKey ? batchesResult.rows : EMPTY_ROWS;

  const coursesLoading = coursesResult.key !== coursesKey;

  const batchesLoading = batchesResult.key !== batchesKey;

  useEffect(() => {
    let ignore = false;

    coursesApi

      .list({
        page: 1,

        limit: 100,

        sort: 'name',

        ...(allInstitutes && tableParams.instituteId
          ? { instituteId: tableParams.instituteId }
          : {}),
      })

      .then(({ rows = [] }) => {
        if (!ignore) {
          setCoursesResult({
            key: coursesKey,

            rows,
          });
        }
      })

      .catch((error) => {
        if (!ignore) {
          setCoursesResult({
            key: coursesKey,

            rows: [],
          });

          notify.error(error);
        }
      });

    return () => {
      ignore = true;
    };
  }, [allInstitutes, tableParams.instituteId, selectedInstitute?.id, notify, coursesKey]);

  useEffect(() => {
    let ignore = false;

    studentsApi

      .batches({
        ...(tableParams.courseId ? { courseId: tableParams.courseId } : {}),

        ...(allInstitutes && tableParams.instituteId
          ? { instituteId: tableParams.instituteId }
          : {}),
      })

      .then(({ batches: availableBatches = [] }) => {
        if (!ignore) {
          setBatchesResult({
            key: batchesKey,

            rows: availableBatches,
          });
        }
      })

      .catch((error) => {
        if (!ignore) {
          setBatchesResult({
            key: batchesKey,

            rows: [],
          });

          notify.error(error);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    allInstitutes,

    tableParams.courseId,

    tableParams.instituteId,

    selectedInstitute?.id,

    notify,

    batchesKey,
  ]);

  const courseNames = useMemo(
    () => new Map(courses.map((course) => [String(course._id), course.name || course.shortCode])),

    [courses],
  );

  const courseShortCodes = useMemo(
    () => new Map(courses.map((course) => [String(course._id), course.shortCode || course.name])),

    [courses],
  );

  const handleSave = async (values) => {
    const instituteId = allInstitutes ? values.instituteId : selectedInstitute?.id;

    if (!instituteId) {
      notify.error('Please select one institute first');

      return;
    }

    const {
      photo,

      instituteId: _formInstituteId,

      semester: _semester,

      ...studentData
    } = values;

    const payload = {
      ...studentData,

      track: String(values.track ?? '').trim(),

      dob: dayjs(values.dob).format('YYYY-MM-DD'),

      admissionDate: dayjs(values.admissionDate).format('YYYY-MM-DD'),
    };

    const createdStudent = await createStudent(payload, instituteId);

    if (photo) {
      try {
        await uploadStudentPhoto(
          createdStudent._id,

          photo,

          instituteId,
        );

        notify.success('Student and photo added successfully');
      } catch {
        notify.error('Student created, but photo upload failed. Please try uploading again.');
      }
    } else {
      notify.success('Student added successfully');
    }

    setOpen(false);

    reloadStudents();
  };

  const instituteOptions = realInstitutes.map((institute) => ({
    value: institute.id,

    label: `${institute.shortCode} - ${institute.name}`,
  }));

  const activeFilters = [
    ...(tableParams.search
      ? [
          {
            key: 'search',

            label: `Search: ${tableParams.search}`,
          },
        ]
      : []),

    ...(tableParams.courseId
      ? [
          {
            key: 'courseId',

            label: `Course: ${courseNames.get(tableParams.courseId) || 'Selected'}`,
          },
        ]
      : []),

    ...(tableParams.batch
      ? [
          {
            key: 'batch',

            label: `Batch: ${tableParams.batch}`,
          },
        ]
      : []),

    ...(tableParams.status
      ? [
          {
            key: 'status',

            label: `Status: ${tableParams.status}`,
          },
        ]
      : []),

    ...(allInstitutes && tableParams.instituteId
      ? [
          {
            key: 'instituteId',

            label: `Institute: ${
              realInstitutes.find((item) => item.id === tableParams.instituteId)?.shortCode ||
              'Selected'
            }`,
          },
        ]
      : []),
  ];

  const clearFilters = () =>
    setTableParams({
      search: '',

      courseId: '',

      batch: '',

      status: '',

      instituteId: '',
    });

  const removeFilter = (key) => setTableParams({ [key]: '' });

  const initials = (name = '') =>
    name

      .trim()

      .split(/\s+/)

      .slice(0, 2)

      .map((part) => part[0] || '')

      .join('')

      .toUpperCase();

  const getStudentYear = (student) => {
    const batch = student.batch;

    const match = String(batch ?? '')
      .trim()

      .match(/^(\d{4})\s*[-/]\s*(\d{2}|\d{4})$/);

    if (!match) return '—';

    const startYear = Number(match[1]);

    const currentYear = new Date().getFullYear();

    const yearNumber = currentYear - startYear + 1;

    const endYear = Number(match[2].length === 2 ? `${match[1].slice(0, 2)}${match[2]}` : match[2]);

    if (currentYear < startYear || currentYear > endYear || yearNumber < 1) {
      return '—';
    }

    return `${yearNumber} Year`;
  };

  const startRow = studentTotal === 0 ? 0 : (tableParams.page - 1) * tableParams.limit + 1;

  const endRow = Math.min(
    tableParams.page * tableParams.limit,

    studentTotal,
  );

  const openStudentProfile = (student) => {
    const studentId = student._id || student.id;

    if (!studentId) {
      notify.error('Student profile could not be opened: student ID is missing');

      return;
    }

    navigate(`/students/${studentId}`);
  };

  const handleStudentRowKeyDown = (event, student) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();

      openStudentProfile(student);
    }
  };

  return (
    <>
      <PageHeader
        title="Students"

        subtitle={`All students of ${
          selectedInstitute?.shortCode === 'ALL'
            ? 'all institutes'
            : selectedInstitute?.shortCode || 'the selected institute'
        }. Open a student to see results, documents, clearance and TC.`}

        actions={
          <Box
            sx={{
              display: 'flex',

              gap: 1,

              flexWrap: 'wrap',

              justifyContent: 'flex-end',
            }}
          >
            <BulkImportButton onImported={reloadStudents} />

            <Button
              variant="contained"

              startIcon={<AddIcon />}

              onClick={() => setOpen(true)}
            >
              Add Student
            </Button>
          </Box>
        }
      />

      <Paper
        variant="outlined"

        sx={{
          borderRadius: 3,

          overflow: 'hidden',
        }}
      >
        {/* Filters */}

        <Box
          sx={{
            p: 2,

            display: 'grid',

            gridTemplateColumns: {
              xs: '1fr',

              sm: 'repeat(2, minmax(0, 1fr))',

              lg: allInstitutes
                ? 'minmax(220px, 1.6fr) repeat(4, minmax(140px, 1fr))'
                : 'minmax(260px, 1.8fr) repeat(3, minmax(150px, 1fr))',
            },

            gap: 1.5,

            alignItems: 'center',
          }}
        >
          <TextField
            label="Search"

            placeholder="Name, father's name, scholar no., roll no., mobile"

            value={tableParams.search ?? ''}

            onChange={(event) => setTableParams({ search: event.target.value, page: 1 })}

            size="small"

            fullWidth

            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          {allInstitutes && (
            <TextField
              select

              label="Institute"

              value={tableParams.instituteId ?? ''}

              onChange={(event) =>
                setTableParams({
                  instituteId: event.target.value,

                  courseId: '',

                  batch: '',

                  page: 1,
                })
              }

              size="small"

              fullWidth
            >
              <MenuItem value="">All institutes</MenuItem>

              {realInstitutes.map((institute) => (
                <MenuItem key={institute.id} value={institute.id}>
                  {institute.shortCode}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select

            label="Course"

            value={tableParams.courseId ?? ''}

            onChange={(event) =>
              setTableParams({
                courseId: event.target.value,

                batch: '',

                page: 1,
              })
            }

            size="small"

            fullWidth

            disabled={coursesLoading}
          >
            <MenuItem value="">All courses</MenuItem>

            {courses.map((course) => (
              <MenuItem key={course._id} value={course._id}>
                {course.name}

                {course.branch ? ` - ${course.branch}` : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select

            label="Batch"

            value={tableParams.batch ?? ''}

            onChange={(event) =>
              setTableParams({
                batch: event.target.value,

                page: 1,
              })
            }

            size="small"

            fullWidth

            disabled={batchesLoading}
          >
            <MenuItem value="">All batches</MenuItem>

            {batches.map((batch) => (
              <MenuItem key={batch} value={batch}>
                {batch}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select

            label="Status"

            value={tableParams.status ?? ''}

            onChange={(event) =>
              setTableParams({
                status: event.target.value,

                page: 1,
              })
            }

            size="small"

            fullWidth
          >
            <MenuItem value="">All statuses</MenuItem>

            {STUDENT_STATUS_LIST.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Active filters */}

        <Box
          sx={{
            minHeight: 50,

            px: 2,

            py: 1,

            borderTop: 1,

            borderBottom: 1,

            borderColor: 'divider',

            display: 'flex',

            alignItems: 'center',

            gap: 1,

            flexWrap: 'wrap',
          }}
        >
          <Typography
            variant="body2"

            color="text.secondary"

            sx={{ mr: 0.5 }}
          >
            Filters:
          </Typography>

          {activeFilters.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No filters applied
            </Typography>
          ) : (
            activeFilters.map((filter) => (
              <Chip
                key={filter.key}

                label={filter.label}

                size="small"

                onDelete={() => removeFilter(filter.key)}

                deleteIcon={<CloseIcon fontSize="small" />}

                sx={{
                  bgcolor: 'action.hover',

                  fontWeight: 600,
                }}
              />
            ))
          )}

          {activeFilters.length > 0 && (
            <Button
              size="small"

              onClick={clearFilters}

              sx={{
                ml: 0.5,

                textTransform: 'none',
              }}
            >
              Clear all
            </Button>
          )}
        </Box>

        {/* Students table */}

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                {['S.No.', 'Name', 'Mobile No.', 'Track', 'Sub.', 'Year', 'Status'].map(
                  (heading) => (
                    <TableCell
                      key={heading}

                      sx={{
                        py: 1.25,

                        color: 'text.secondary',

                        fontSize: 12,

                        fontWeight: 700,

                        textTransform: 'uppercase',

                        whiteSpace: 'nowrap',
                      }}
                    >
                      {heading}
                    </TableCell>
                  ),
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {studentsError ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="error" sx={{ mb: 1 }}>
                      Unable to load students.
                    </Typography>

                    <Button onClick={reloadStudents}>Retry</Button>
                  </TableCell>
                </TableRow>
              ) : studentsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : studentRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="text.secondary">
                      No students found. Try changing your search or filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                studentRows.map((student, index) => (
                  <TableRow
                    key={student._id || student.id}

                    hover

                    role="link"

                    tabIndex={0}

                    aria-label={`Open profile of ${student.name}`}

                    onClick={() => openStudentProfile(student)}

                    onKeyDown={(event) => handleStudentRowKeyDown(event, student)}

                    sx={{
                      cursor: 'pointer',

                      '&:focus-visible': {
                        outline: '2px solid',

                        outlineColor: 'primary.main',

                        outlineOffset: '-2px',
                      },

                      '&:last-child td': {
                        borderBottom: 0,
                      },
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: 700,

                        whiteSpace: 'nowrap',
                      }}
                    >
                      {(tableParams.page - 1) * tableParams.limit + index + 1}
                    </TableCell>

                    <TableCell sx={{ minWidth: 220 }}>
                      <Box
                        sx={{
                          display: 'flex',

                          alignItems: 'center',

                          gap: 1.25,
                        }}
                      >
                        <Avatar
                          src={student.photoUrl || student.photo}

                          sx={{
                            width: 34,

                            height: 34,

                            bgcolor: 'action.selected',

                            color: 'primary.main',

                            fontSize: 12,

                            fontWeight: 700,
                          }}
                        >
                          {initials(student.name)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"

                            sx={{
                              display: 'block',

                              fontWeight: 700,

                              color: 'text.primary',
                            }}
                          >
                            {student.name}
                          </Typography>

                          <Typography
                            variant="caption"

                            color="text.secondary"
                          >
                            {student.fatherName
                              ? `${
                                  student.gender === 'Female' ? 'D/o' : 'S/o'
                                } ${student.fatherName}`
                              : '—'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{student.mobile || '—'}</TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{student.track || '—'}</TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {courseShortCodes.get(String(student.courseId?._id || student.courseId)) ||
                        '—'}
                    </TableCell>

                    <TableCell
                      sx={{
                        whiteSpace: 'nowrap',

                        fontWeight: 600,
                      }}
                    >
                      {getStudentYear(student)}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={student.status || '—'}

                        size="small"

                        sx={{
                          bgcolor:
                            student.status === STUDENT_STATUSES.STUDYING
                              ? 'rgba(47, 100, 235, 0.14)'
                              : 'action.selected',

                          color:
                            student.status === STUDENT_STATUSES.STUDYING
                              ? 'primary.dark'
                              : 'text.primary',

                          fontWeight: 700,

                          borderRadius: 1.5,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}

        <Box
          sx={{
            display: 'flex',

            alignItems: 'center',

            justifyContent: 'space-between',

            flexWrap: 'wrap',

            borderTop: 1,

            borderColor: 'divider',

            px: 2,
          }}
        >
          <Typography
            variant="body2"

            color="text.secondary"

            sx={{ pl: { xs: 0, sm: 0.25 } }}
          >
            Showing {startRow}–{endRow} of {studentTotal} students
          </Typography>

          <TablePagination
            component="div"

            count={studentTotal}

            page={studentTotal === 0 ? 0 : tableParams.page - 1}

            rowsPerPage={tableParams.limit}

            rowsPerPageOptions={[10, 25, 50, 100]}

            labelRowsPerPage="Rows per page:"

            labelDisplayedRows={() => ''}

            onPageChange={(_event, page) => setTableParams({ page: page + 1 })}

            onRowsPerPageChange={(event) =>
              setTableParams({
                limit: Number(event.target.value),

                page: 1,
              })
            }

            sx={{
              '& .MuiTablePagination-displayedRows': {
                display: 'none',
              },
            }}
          />
        </Box>
      </Paper>

      {/* Add Student dialog */}

      <FormDialog
        open={open}

        title="Add Student"

        maxWidth="lg"

        contentSpacing={0}

        defaultValues={{
          instituteId: '',

          scholarNo: '',

          enrollmentNo: '',

          rollNo: '',

          name: '',

          fatherName: '',

          motherName: '',

          dob: null,

          gender: '',

          category: '',

          admissionDate: null,

          mobile: '',

          religion: '',

          photo: null,

          courseId: '',

          branch: '',

          batch: '',

          track: '',
        }}

        onSubmit={handleSave}

        loading={createLoading || photoUploadLoading}

        onClose={() => setOpen(false)}

        submitLabel="Save Student"
      >
        <Box
          sx={{
            display: 'grid',

            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',

              sm: 'repeat(2, minmax(0, 1fr))',

              md: 'repeat(3, minmax(0, 1fr))',
            },

            columnGap: 2,

            rowGap: 2.5,

            py: 1,

            width: '100%',
          }}
        >
          {/* Institute, Scholar Number, Enrollment Number */}

          {allInstitutes && (
            <Box sx={{ minWidth: 0 }}>
              <FormSelect
                name="instituteId"

                label="Institute"

                options={instituteOptions}

                rules={{
                  required: 'Please select an institute',
                }}

                fullWidth
              />
            </Box>
          )}

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="scholarNo"

              label="Scholar Number"

              placeholder="Enter Scholar Number"

              autoComplete="off"

              rules={{
                required: 'Scholar number is required',

                validate: validateNotBlank,
              }}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="enrollmentNo"

              label="Enrollment Number"

              placeholder="Enter Enrollment Number"

              autoComplete="off"

              fullWidth
            />
          </Box>

          {/* Roll Number, Student Name, Father's Name */}

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="rollNo"

              label="Roll Number"

              placeholder="Enter Roll Number"

              autoComplete="off"

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="name"

              label="Student Name"

              placeholder="Enter Student Name"

              autoComplete="off"

              rules={{
                required: 'Student name is required',

                validate: validatePersonName,
              }}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="fatherName"

              label="Father's Name"

              placeholder="Enter Father's Name"

              autoComplete="off"

              rules={{
                required: "Father's name is required",

                validate: validatePersonName,
              }}

              fullWidth
            />
          </Box>

          {/* Mother's Name, Gender, Category */}

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="motherName"

              label="Mother's Name"

              placeholder="Enter Mother's Name"

              autoComplete="off"

              rules={{
                validate: (value) => !String(value ?? '').trim() || validatePersonName(value),
              }}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormSelect
              name="gender"

              label="Gender"

              options={genderOptions}

              rules={{
                required: 'Please select gender',
              }}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormSelect
              name="category"

              label="Category"

              options={categoryOptions}

              rules={{
                required: 'Please select category',
              }}

              fullWidth
            />
          </Box>

          {/* Mobile, Religion, Track */}

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="mobile"

              label="Mobile Number"

              placeholder="Enter 10-digit Mobile Number"

              type="tel"

              autoComplete="off"

              onInput={(event) => {
                event.target.value = event.target.value

                  .replace(/\D/g, '')

                  .slice(0, 10);
              }}

              slotProps={{
                htmlInput: {
                  maxLength: 10,

                  inputMode: 'numeric',

                  pattern: '[0-9]*',
                },
              }}

              rules={{
                required: 'Mobile number is required',

                validate: validateMobile,
              }}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormSelect
              name="religion"

              label="Religion"

              options={RELIGION_OPTIONS}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="track"

              label="Track / Place"

              placeholder="Enter Track / Place"

              autoComplete="off"

              fullWidth
            />
          </Box>

          {/* Course, Branch, Batch */}

          <Box sx={{ minWidth: 0 }}>
            <StudentCourseField
              allInstitutes={allInstitutes}

              selectedInstitute={selectedInstitute}
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="branch"

              label="Branch"

              placeholder="Enter Branch"

              autoComplete="off"

              rules={{
                required: 'Branch is required',

                validate: validateNotBlank,
              }}

              fullWidth
            />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <FormTextField
              name="batch"

              label="Batch"

              placeholder="Enter Batch"

              autoComplete="off"

              rules={{
                required: 'Batch is required',

                validate: validateNotBlank,
              }}

              fullWidth
            />
          </Box>

          {/* Date of Birth, Admission Date and Student Photo - bottom row */}
          <Box sx={{ minWidth: 0, width: '100%' }}>
            <FormDateField
              name="dob"
              label="Date of Birth"
              rules={{
                required: 'Date of birth is required',
              }}
              disableFuture
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { width: '100%' },
                },
              }}
              sx={{ width: '100%' }}
            />
          </Box>

          <Box sx={{ minWidth: 0, width: '100%' }}>
            <FormDateField
              name="admissionDate"
              label="Admission Date"
              rules={{
                required: 'Admission date is required',
                validate: validateAdmissionDate,
                deps: ['dob'],
              }}
              disableFuture
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: { width: '100%' },
                },
              }}
              sx={{ width: '100%' }}
            />
          </Box>

          <Box sx={{ minWidth: 0, width: '100%' }}>
            <FormPhotoUpload name="photo" label="Student Photo" />
          </Box>
        </Box>
      </FormDialog>
    </>
  );
}
