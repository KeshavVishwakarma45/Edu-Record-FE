import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PageHeader from '../../components/PageHeader';

// Demo course structure.
// Replace these sample terms and subjects with the institute's actual syllabus.
const COURSE_CONFIG = {
  BCA: {
    terms: {
      'Year I': [
        'Computer Fundamentals',
        'Programming in C',
        'Mathematics I',
        'Digital Electronics',
        'Communication Skills',
      ],
      'Year II': [
        'Data Structures',
        'Database Management System',
        'Java Programming',
        'Operating Systems',
        'Computer Networks',
      ],
      'Year III': [
        'Web Development',
        'Python Programming',
        'Software Engineering',
        'Cloud Computing',
        'Project Work',
      ],
    },
  },

  BBA: {
    terms: {
      'Semester I': [
        'Principles of Management',
        'Business Communication',
        'Business Economics',
        'Financial Accounting',
      ],
      'Semester II': [
        'Marketing Management',
        'Business Statistics',
        'Organisational Behaviour',
        'Business Law',
      ],
      'Semester III': [
        'Human Resource Management',
        'Cost Accounting',
        'Business Research',
        'Entrepreneurship',
      ],
      'Semester IV': [
        'Financial Management',
        'Operations Management',
        'Consumer Behaviour',
        'Business Environment',
      ],
    },
  },

  'B.Com': {
    terms: {
      'Year I': [
        'Financial Accounting',
        'Business Economics',
        'Business Law',
        'Business Mathematics',
      ],
      'Year II': ['Corporate Accounting', 'Income Tax', 'Cost Accounting', 'Company Law'],
      'Year III': ['Auditing', 'Management Accounting', 'Indirect Tax', 'Financial Management'],
    },
  },
};

const EXAM_SESSIONS = ['Jun 2026', 'Dec 2026', 'Jun 2025', 'Dec 2025'];

const ATTEMPT_OPTIONS = ['First', 'Second', 'Third', 'Fourth'];

const INITIAL_STUDENTS = [
  {
    id: 1,
    rollNumber: '231042',
    name: 'Riya Sharma',
    resultStatus: 'PASS',
    atktSubjects: [],
    attempt: '',
  },
  {
    id: 2,
    rollNumber: '231043',
    name: 'Aditya Pal',
    resultStatus: 'ATKT',
    atktSubjects: ['BCA-102 Mathematics'],
    attempt: 'Second',
  },
  {
    id: 3,
    rollNumber: '231044',
    name: 'Kriti Joshi',
    resultStatus: 'PASS',
    atktSubjects: [],
    attempt: '',
  },
  {
    id: 4,
    rollNumber: '231045',
    name: 'Sameer Khan',
    resultStatus: 'FAIL',
    atktSubjects: [],
    attempt: '',
  },
  {
    id: 5,
    rollNumber: '231046',
    name: 'Bhavna Rajput',
    resultStatus: 'PASS',
    atktSubjects: [],
    attempt: 'Second',
  },
  {
    id: 6,
    rollNumber: '231047',
    name: 'Deepak Kushwah',
    resultStatus: 'ABSENT',
    atktSubjects: [],
    attempt: '',
  },
];

const RESULT_STATUSES = [
  { value: 'PASS', label: 'Pass' },
  { value: 'ATKT', label: 'ATKT' },
  { value: 'FAIL', label: 'Fail' },
  { value: 'ABSENT', label: 'Absent' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'PASS':
      return 'success';
    case 'ATKT':
      return 'warning';
    case 'FAIL':
      return 'error';
    default:
      return 'default';
  }
};

const SUMMARY_ITEMS = [
  { key: 'total', label: 'Total' },
  { key: 'PASS', label: 'Pass' },
  { key: 'ATKT', label: 'ATKT' },
  { key: 'FAIL', label: 'Fail' },
];

export default function ResultsPage() {
  const [filters, setFilters] = useState({
    course: 'BCA',
    examTerm: 'Year I',
    examSession: 'Jun 2026',
    resultDate: '2026-08-28',
  });

  const [students, setStudents] = useState(INITIAL_STUDENTS);
  const [bulkStatus, setBulkStatus] = useState('PASS');
  const [message, setMessage] = useState('');

  // Get terms for the selected course.
  const availableTerms = useMemo(() => {
    return Object.keys(COURSE_CONFIG[filters.course]?.terms || {});
  }, [filters.course]);

  // Get subjects for the selected course and exam term.
  const availableSubjects = useMemo(() => {
    return COURSE_CONFIG[filters.course]?.terms?.[filters.examTerm] || [];
  }, [filters.course, filters.examTerm]);

  // Calculate result summary automatically.
  const summary = useMemo(() => {
    const counts = {
      total: students.length,
      PASS: 0,
      ATKT: 0,
      FAIL: 0,
    };

    students.forEach((student) => {
      if (student.resultStatus && counts[student.resultStatus] !== undefined) {
        counts[student.resultStatus] += 1;
      }
    });

    return counts;
  }, [students]);

  const handleFilterChange = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));

    // Clear previous messages when filters change.
    setMessage('');
  };

  const handleCourseChange = (event) => {
    const course = event.target.value;
    const firstTerm = Object.keys(COURSE_CONFIG[course].terms)[0];

    setFilters((previous) => ({
      ...previous,
      course,
      examTerm: firstTerm,
    }));

    // Reset sample student results when course changes.
    setStudents(INITIAL_STUDENTS);
    setMessage('');
  };

  const handleTermChange = (event) => {
    handleFilterChange('examTerm', event.target.value);
    setStudents(INITIAL_STUDENTS);
  };

  const handleStudentChange = (studentId, field, value) => {
    setStudents((previous) =>
      previous.map((student) => {
        if (student.id !== studentId) return student;

        const updatedStudent = {
          ...student,
          [field]: value,
        };

        // Clear ATKT subjects if the result is no longer ATKT.
        if (field === 'resultStatus' && value !== 'ATKT') {
          updatedStudent.atktSubjects = [];
        }

        return updatedStudent;
      }),
    );

    setMessage('');
  };

  const handleBulkApply = () => {
    if (!bulkStatus) return;

    setStudents((previous) =>
      previous.map((student) => {
        if (student.resultStatus) return student;

        return {
          ...student,
          resultStatus: bulkStatus,
          atktSubjects: [],
        };
      }),
    );

    setMessage('Status applied to all empty result rows.');
  };

  const handleSave = () => {
    if (!filters.course || !filters.examTerm || !filters.examSession) {
      setMessage('Please select Course, Exam Term and Exam Session.');
      return;
    }

    const incompleteRows = students.filter((student) => !student.resultStatus);

    if (incompleteRows.length > 0) {
      setMessage('Please enter a result for every student.');
      return;
    }

    const invalidAtktRows = students.filter(
      (student) => student.resultStatus === 'ATKT' && student.atktSubjects.length === 0,
    );

    if (invalidAtktRows.length > 0) {
      setMessage('Please select ATKT subjects for every ATKT student.');
      return;
    }

    setMessage('Validation successful! Backend save API is not connected yet.');
  };

  return (
    <Box>
      <PageHeader
        title="Results"
        subtitle="Enter one exam at a time. The summary replaces the paper result register."
        actions={
          <Button
            variant="outlined"
            disabled
            sx={{
              borderStyle: 'dashed',
              borderRadius: 5,
              whiteSpace: 'nowrap',
            }}
          >
            Import university result (soon)
          </Button>
        }
      />

      <Stack spacing={2}>
        {/* FILTER SECTION */}
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.7}>
                  Course
                </Typography>

                <FormControl fullWidth size="small">
                  <Select value={filters.course} onChange={handleCourseChange}>
                    {Object.keys(COURSE_CONFIG).map((course) => (
                      <MenuItem key={course} value={course}>
                        {course}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.7}>
                  Exam term
                </Typography>

                <FormControl fullWidth size="small">
                  <Select value={filters.examTerm} onChange={handleTermChange}>
                    {availableTerms.map((term) => (
                      <MenuItem key={term} value={term}>
                        {term}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.7}>
                  Exam session
                </Typography>

                <FormControl fullWidth size="small">
                  <Select
                    value={filters.examSession}
                    onChange={(event) => handleFilterChange('examSession', event.target.value)}
                  >
                    {EXAM_SESSIONS.map((session) => (
                      <MenuItem key={session} value={session}>
                        {session}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} mb={0.7}>
                  Result date
                </Typography>

                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={filters.resultDate}
                  onChange={(event) => handleFilterChange('resultDate', event.target.value)}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* SUMMARY CARDS */}
        <Grid container spacing={2}>
          {SUMMARY_ITEMS.map((item) => (
            <Grid key={item.key} size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {item.label}
                  </Typography>

                  <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{
                      mt: 0.5,
                      color:
                        item.key === 'PASS'
                          ? 'primary.main'
                          : item.key === 'ATKT'
                            ? 'warning.dark'
                            : item.key === 'FAIL'
                              ? 'error.main'
                              : 'text.primary',
                    }}
                  >
                    {summary[item.key]}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* RESULTS TABLE */}
        <Card variant="outlined">
          <CardContent sx={{ p: 0 }}>
            {/* BULK ACTION */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={1}
              sx={{
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" fontWeight={600}>
                Set all empty rows to
              </Typography>

              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)}>
                  {RESULT_STATUSES.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button variant="outlined" color="inherit" onClick={handleBulkApply}>
                Apply
              </Button>
            </Stack>

            {/* TABLE */}
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 850 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 700 }}>ROLL NO.</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>STUDENT</TableCell>

                    <TableCell sx={{ fontWeight: 700, minWidth: 170 }}>RESULT</TableCell>

                    <TableCell sx={{ fontWeight: 700, minWidth: 230 }}>ATKT SUBJECTS</TableCell>

                    <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>ATTEMPT</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {student.rollNumber}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{student.name}</Typography>
                      </TableCell>

                      {/* RESULT */}
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            displayEmpty
                            value={student.resultStatus}
                            onChange={(event) =>
                              handleStudentChange(student.id, 'resultStatus', event.target.value)
                            }
                            renderValue={(value) => {
                              const status = RESULT_STATUSES.find((item) => item.value === value);

                              if (!status) return 'Select result';

                              return (
                                <Chip
                                  size="small"
                                  color={getStatusColor(value)}
                                  label={status.label}
                                  variant="outlined"
                                />
                              );
                            }}
                          >
                            <MenuItem value="">Select result</MenuItem>

                            {RESULT_STATUSES.map((status) => (
                              <MenuItem key={status.value} value={status.value}>
                                {status.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>

                      {/* ATKT SUBJECTS */}
                      <TableCell>
                        <FormControl
                          fullWidth
                          size="small"
                          disabled={student.resultStatus !== 'ATKT'}
                        >
                          <Select
                            multiple
                            displayEmpty
                            value={student.atktSubjects}
                            onChange={(event) =>
                              handleStudentChange(student.id, 'atktSubjects', event.target.value)
                            }
                            renderValue={(selected) =>
                              selected.length ? selected.join(', ') : 'Only for ATKT'
                            }
                            sx={{
                              bgcolor:
                                student.resultStatus === 'ATKT'
                                  ? 'background.paper'
                                  : 'action.hover',
                            }}
                          >
                            {availableSubjects.map((subject) => (
                              <MenuItem key={subject} value={subject}>
                                {subject}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>

                      {/* ATTEMPT */}
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            displayEmpty
                            value={student.attempt}
                            onChange={(event) =>
                              handleStudentChange(student.id, 'attempt', event.target.value)
                            }
                            renderValue={(value) => value || '—'}
                          >
                            <MenuItem value="">—</MenuItem>

                            {ATTEMPT_OPTIONS.map((attempt) => (
                              <MenuItem key={attempt} value={attempt}>
                                {attempt}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}

                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No students found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* SAVE SECTION */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={2}
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {students.length} students
              </Typography>

              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSave}
                sx={{
                  borderRadius: 5,
                  px: 3,
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                }}
              >
                Save results
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {message && (
          <Alert
            severity={message.includes('Validation successful') ? 'success' : 'warning'}
            onClose={() => setMessage('')}
          >
            {message}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}
