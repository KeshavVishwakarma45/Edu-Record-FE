import {
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';

import { useFormContext, useWatch } from 'react-hook-form';
import { useCallback, useEffect, useState } from 'react';

import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';
import FormSelect from '@/components/form/FormSelect';
import FormTextField from '@/components/form/FormTextField';
import FormDateField from '@/components/form/FormDateField';

import { inwardApi } from '@/api/inward';
import { organisationApi } from '@/api/organisation';
import { coursesApi } from '@/api/courses';

import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useNotify } from '@/hooks/useNotify';

// Document types
const DOCUMENT_TYPES = [
  { value: 'Marksheet', label: 'Marksheet' },
  { value: 'Provisional', label: 'Provisional' },
  { value: 'Degree', label: 'Degree' },
  { value: 'Migration', label: 'Migration' },
];

const MISSING_REASONS = [
  { value: 'RESULT_WITHHELD', label: 'Result Withheld' },
  { value: 'UNIVERSITY_FEES_DUE', label: 'University Fees Due' },
  { value: 'ENROLLMENT_PROBLEM', label: 'Enrollment Problem' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'NAME_DETAIL_MISMATCH', label: 'Name / Detail Mismatch' },
  { value: 'NOT_PRINTED', label: 'Not Printed' },
  { value: 'OTHER', label: 'Other' },
];

const getRows = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.rows)) return result.data.rows;
  return [];
};

const getMissingId = (row) => row.missingDetails?._id || row.missingId || row._id;

// Exam months: backend expects numeric month values
const EXAM_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((month, index) => ({
  value: index + 1,
  label: month,
}));

const currentYear = new Date().getFullYear();

const EXAM_YEARS = Array.from({ length: 10 }, (_, index) => {
  const year = currentYear - 4 + index;

  return {
    value: String(year),
    label: String(year),
  };
});

// Batch table columns
const columns = [
  {
    field: 'universityName',
    header: 'University',
    sortable: true,
    render: (row) => row.universityName || row.university?.name || '—',
  },
  {
    field: 'courseName',
    header: 'Course',
    sortable: true,
    render: (row) => row.courseName || row.course?.name || '—',
  },
  {
    field: 'examTerm',
    header: 'Exam Term',
    render: (row) => row.examTerm || '—',
  },
  {
    field: 'examSession',
    header: 'Exam Session',
    render: (row) => {
      if (typeof row.examSession === 'string') {
        return row.examSession;
      }

      if (row.examSession?.month && row.examSession?.year) {
        return `${row.examSession.month} / ${row.examSession.year}`;
      }

      return '—';
    },
  },
  {
    field: 'documentType',
    header: 'Document Type',
    render: (row) => row.documentType || '—',
  },
  {
    field: 'receivedDate',
    header: 'Received Date',
    render: (row) => row.receivedDate || '—',
  },
  {
    field: 'counts',
    header: 'Expected / Received / Missing',
    render: (row) => {
      const counts = row.counts || {};

      return `${counts.expected ?? 0} / ${counts.received ?? 0} / ${counts.missing ?? 0}`;
    },
  },
];

const INITIAL_VALUES = {
  instituteId: '',
  universityId: '',
  courseId: '',
  examTerm: '',
  examMonth: '',
  examYear: String(currentYear),
  documentType: '',
  receivedDate: null,
  receivedBy: '',
  referenceNumber: '',
};

// Convert API student records into a consistent UI structure
const mapStudentRecords = (records) => {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.map((record) => {
    const student = record.studentId || {};

    return {
      ...record,
      studentName: student.name || '—',
      scholarNo: student.scholarNo || '—',
      rollNo: student.rollNo || '—',
      enrollmentNo: student.enrollmentNo || '—',
      documentSerialNo: record.documentSerialNo || '',
      almirahNo: record.storageLocation?.almirah || '',
      fileNo: record.storageLocation?.fileNo || '',
    };
  });
};

// Course dropdown
function CourseField() {
  const { control, setValue } = useFormContext();

  const instituteId = useWatch({
    control,
    name: 'instituteId',
  });

  const [courseOptions, setCourseOptions] = useState([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState('');

  useEffect(() => {
    let active = true;

    // Clear previous course when institute changes
    setValue('courseId', '');

    const loadCourses = async () => {
      if (!instituteId) {
        setCourseOptions([]);
        setCourseLoading(false);
        setCourseError('');
        return;
      }

      setCourseLoading(true);
      setCourseError('');

      try {
        const result = await coursesApi.list(
          {
            page: 1,
            limit: 100,
            sort: 'name',
          },
          instituteId,
        );

        if (active) {
          const options = (result.rows || []).map((course) => ({
            value: course._id,
            label: `${course.name} (${course.shortCode})`,
          }));

          setCourseOptions(options);
        }
      } catch (error) {
        if (active) {
          setCourseOptions([]);
          setCourseError(error?.message || 'Unable to load courses');
        }
      } finally {
        if (active) {
          setCourseLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      active = false;
    };
  }, [instituteId, setValue]);

  return (
    <FormSelect
      name="courseId"
      label="Course"
      options={courseOptions}
      disabled={!instituteId || courseLoading}
      helperText={
        courseError ||
        (courseLoading
          ? 'Loading courses...'
          : !instituteId
            ? 'Select an institute first'
            : courseOptions.length === 0
              ? 'No courses found'
              : '')
      }
      rules={{
        required: 'Select a course',
      }}
    />
  );
}

export default function InwardBatchesPage() {
  const { selectedInstitute, institutes } = useAuth();
  const notify = useNotify();

  // Institute options
  const instituteOptions = (institutes || []).map((institute) => ({
    value: institute.id,
    label: institute.name,
  }));

  // Batch listing
  const list = useList(inwardApi.list, {
    sort: '-createdAt',
  });

  const [batchCounts, setBatchCounts] = useState({});

  // University dropdown
  const [universityOptions, setUniversityOptions] = useState([]);
  const [universityLoading, setUniversityLoading] = useState(false);
  const [universityError, setUniversityError] = useState('');

  // Create batch dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  // Selected batch and students
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [expectedStudents, setExpectedStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  // Receive / edit receipt dialog
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isEditingReceipt, setIsEditingReceipt] = useState(false);

  const [documentSerialNo, setDocumentSerialNo] = useState('');
  const [almirahNo, setAlmirahNo] = useState('');
  const [fileNo, setFileNo] = useState('');

  const [receiptSaving, setReceiptSaving] = useState(false);
  // Missing documents
  const [missingRows, setMissingRows] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingDialogOpen, setMissingDialogOpen] = useState(false);
  const [missingSaving, setMissingSaving] = useState(false);
  const [editingMissing, setEditingMissing] = useState(null);

  const [missingReason, setMissingReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  // Pending inward documents
  const [pendingRows, setPendingRows] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');

  // Covering letter UI
  const [coveringLetter, setCoveringLetter] = useState(null);
  const [coveringLetterError, setCoveringLetterError] = useState('');

  // Load batch counts
  useEffect(() => {
    let active = true;

    const loadBatchCounts = async () => {
      const batches = list.rows || [];

      if (batches.length === 0) {
        setBatchCounts({});
        return;
      }

      const results = await Promise.all(
        batches.map(async (batch) => {
          try {
            const counts = await inwardApi.getCounts(batch._id, batch.instituteId);
            return [batch._id, counts];
          } catch {
            return [batch._id, { expected: 0, received: 0, missing: 0 }];
          }
        }),
      );

      if (active) {
        setBatchCounts(Object.fromEntries(results));
      }
    };

    loadBatchCounts();

    return () => {
      active = false;
    };
  }, [list.rows]);

  const loadMissingDocuments = useCallback(
    async (batchId, instituteId) => {
      if (!batchId) {
        return [];
      }

      try {
        const result = await inwardApi.getMissing(batchId, instituteId);
        return getRows(result);
      } catch (error) {
        notify.error(error);
        return [];
      }
    },
    [notify],
  );

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!selectedBatch?._id) {
        setMissingRows([]);
        return;
      }

      setMissingLoading(true);

      const rows = await loadMissingDocuments(selectedBatch._id, selectedBatch.instituteId);

      if (active) {
        setMissingRows(rows);
        setMissingLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [selectedBatch?._id, selectedBatch?.instituteId, loadMissingDocuments]);

  // Load university options
  useEffect(() => {
    let active = true;

    const loadUniversities = async () => {
      setUniversityLoading(true);
      setUniversityError('');

      try {
        const result = await organisationApi.universities();

        if (active) {
          setUniversityOptions(result || []);
        }
      } catch (error) {
        if (active) {
          setUniversityError(error?.message || 'Unable to load universities');
        }
      } finally {
        if (active) {
          setUniversityLoading(false);
        }
      }
    };

    loadUniversities();

    return () => {
      active = false;
    };
  }, []);

  // Load students whenever selected batch changes
  useEffect(() => {
    let active = true;

    const loadStudents = async () => {
      if (!selectedBatch?._id) {
        setExpectedStudents([]);
        setStudentsError('');
        return;
      }

      setStudentsLoading(true);
      setStudentsError('');

      try {
        const result = await inwardApi.getStudents(selectedBatch._id, selectedBatch.instituteId);

        if (active) {
          setExpectedStudents(mapStudentRecords(getRows(result)));
        }
      } catch (error) {
        if (active) {
          setExpectedStudents([]);
          setStudentsError(error?.message || 'Unable to load students');

          notify.error(error);
        }
      } finally {
        if (active) {
          setStudentsLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      active = false;
    };
  }, [selectedBatch?._id, selectedBatch?.instituteId, notify]);

  // Filter students
  const filteredStudents = expectedStudents.filter((student) =>
    [student.studentName, student.scholarNo, student.rollNo, student.enrollmentNo]
      .join(' ')
      .toLowerCase()
      .includes(studentSearch.toLowerCase()),
  );

  // Student counts
  const totalExpected = expectedStudents.length;

  const totalReceived = expectedStudents.filter(
    (student) => student.status === 'In custody',
  ).length;

  const totalMissing = expectedStudents.filter(
    (student) => student.status === 'Missing' || student.status === 'Not received',
  ).length;

  // Create batch
  const handleCreate = async (values) => {
    try {
      const receivedDate = values.receivedDate?.format
        ? values.receivedDate.format('YYYY-MM-DD')
        : String(values.receivedDate || '').slice(0, 10);

      const payload = {
        universityId: values.universityId,
        courseId: values.courseId,
        examTerm: values.examTerm.trim(),
        examSession: {
          month: Number(values.examMonth),
          year: Number(values.examYear),
        },
        documentType: values.documentType,
        receivedDate,
        ...(values.referenceNumber?.trim()
          ? {
              referenceNumber: values.referenceNumber.trim(),
            }
          : {}),
      };

      const result = await inwardApi.create(payload, values.instituteId);

      setDialogOpen(false);
      setCoveringLetter(null);
      setCoveringLetterError('');

      notify.success('Inward batch created successfully');

      await list.reload();

      // Open newly created batch if API returned its ID
      const newBatch = result?._id ? result : result?.data?._id ? result.data : null;

      if (newBatch?._id) {
        setSelectedBatch(newBatch);
        setStudentSearch('');
      }
    } catch (error) {
      notify.error(error);
    }
  };

  const handleCloseCreateDialog = () => {
    setDialogOpen(false);
    setCoveringLetter(null);
    setCoveringLetterError('');
  };

  // Open receive dialog
  const handleOpenReceiveDialog = (student) => {
    setSelectedStudent(student);
    setIsEditingReceipt(false);

    setDocumentSerialNo(student.documentSerialNo || '');
    setAlmirahNo(student.almirahNo || '');
    setFileNo(student.fileNo || '');

    setReceiveDialogOpen(true);
  };

  // Open edit receipt dialog
  const handleOpenEditReceipt = (student) => {
    setSelectedStudent(student);
    setIsEditingReceipt(true);

    setDocumentSerialNo(student.documentSerialNo || '');
    setAlmirahNo(student.almirahNo || '');
    setFileNo(student.fileNo || '');

    setReceiveDialogOpen(true);
  };

  // Close receive dialog
  const handleCloseReceiveDialog = () => {
    if (receiptSaving) {
      return;
    }

    setReceiveDialogOpen(false);
    setSelectedStudent(null);
    setIsEditingReceipt(false);

    setDocumentSerialNo('');
    setAlmirahNo('');
    setFileNo('');
  };

  // Receive new document or update existing receipt
  const handleSaveReceipt = async () => {
    if (!selectedBatch?._id || !selectedStudent?._id) {
      return;
    }

    const payload = {
      documentSerialNo: documentSerialNo.trim(),
      storageLocation: {
        almirah: almirahNo.trim(),
        fileNo: fileNo.trim(),
      },
    };

    setReceiptSaving(true);

    try {
      if (isEditingReceipt) {
        await inwardApi.updateReceipt(
          selectedBatch._id,
          selectedStudent._id,
          payload,
          selectedBatch.instituteId,
        );

        notify.success('Receipt updated successfully');
      } else {
        const studentId = selectedStudent.studentId?._id;

        if (!studentId) {
          throw new Error('Student ID is missing');
        }

        await inwardApi.receive(
          selectedBatch._id,
          {
            studentId,
            ...payload,
          },
          selectedBatch.instituteId,
        );

        notify.success('Document received successfully');
      }

      setReceiveDialogOpen(false);
      setSelectedStudent(null);
      setIsEditingReceipt(false);

      setDocumentSerialNo('');
      setAlmirahNo('');
      setFileNo('');

      // Refresh students after successful action
      const result = await inwardApi.getStudents(selectedBatch._id, selectedBatch.instituteId);

      setExpectedStudents(mapStudentRecords(getRows(result)));

      // Refresh batch list and counts
      await list.reload();
    } catch (error) {
      notify.error(error);
    } finally {
      setReceiptSaving(false);
    }
  };

  const handleOpenMarkMissing = (student) => {
    setEditingMissing(student);
    setMissingReason('');
    setOtherReason('');
    setFollowUpDate('');
    setMissingDialogOpen(true);
  };

  const handleOpenUpdateMissing = (row) => {
    const details = row.missingDetails || row;

    setEditingMissing(row);
    setMissingReason(details.reason || '');
    setOtherReason(details.otherReason || '');
    setFollowUpDate(details.followUpDate ? String(details.followUpDate).slice(0, 10) : '');
    setMissingDialogOpen(true);
  };

  const handleCloseMissingDialog = () => {
    if (missingSaving) return;

    setMissingDialogOpen(false);
    setEditingMissing(null);
    setMissingReason('');
    setOtherReason('');
    setFollowUpDate('');
  };

  const handleSaveMissing = async () => {
    if (!selectedBatch?._id || !editingMissing) return;

    if (!missingReason || !followUpDate) {
      notify.error(new Error('Reason and follow-up date are required'));
      return;
    }

    if (missingReason === 'OTHER' && !otherReason.trim()) {
      notify.error(new Error('Please enter the other reason'));
      return;
    }

    const payload = {
      reason: missingReason,
      followUpDate,
      ...(missingReason === 'OTHER' ? { otherReason: otherReason.trim() } : {}),
    };

    setMissingSaving(true);

    try {
      if (editingMissing.missingDetails || editingMissing.missingId) {
        const missingId = getMissingId(editingMissing);

        await inwardApi.updateMissing(
          selectedBatch._id,
          missingId,
          payload,
          selectedBatch.instituteId,
        );

        notify.success('Missing details updated successfully');
      } else {
        const studentId = editingMissing.studentId?._id;

        if (!studentId) {
          throw new Error('Student ID is missing');
        }

        await inwardApi.markMissing(
          selectedBatch._id,
          {
            studentId,
            ...payload,
          },
          selectedBatch.instituteId,
        );

        notify.success('Document marked as missing');
      }

      setMissingDialogOpen(false);
      setEditingMissing(null);

      const [studentsResult, missingResult] = await Promise.all([
        inwardApi.getStudents(selectedBatch._id, selectedBatch.instituteId),
        inwardApi.getMissing(selectedBatch._id, selectedBatch.instituteId),
      ]);

      setExpectedStudents(mapStudentRecords(getRows(studentsResult)));
      setMissingRows(getRows(missingResult));

      await list.reload();
    } catch (error) {
      notify.error(error);
    } finally {
      setMissingSaving(false);
    }
  };

  const loadPendingDocuments = async (search = '') => {
    setPendingLoading(true);
    setPendingError('');

    try {
      const result = await inwardApi.getPending({
        page: 1,
        limit: 100,
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      setPendingRows(getRows(result));
    } catch (error) {
      setPendingRows([]);
      setPendingError(error?.message || 'Unable to load pending documents');
      notify.error(error);
    } finally {
      setPendingLoading(false);
    }
  };

  // Validate covering letter PDF
  const validateCoveringLetter = (file) => {
    if (!file) {
      return 'Please select a PDF file';
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return 'Only PDF files are allowed';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'PDF size must not exceed 5 MB';
    }

    return '';
  };

  return (
    <>
      <PageHeader
        title="University document inward"
        subtitle={
          selectedInstitute
            ? `Inward batches for ${selectedInstitute.name}`
            : 'University document inward batches'
        }
        backTo="/"
        actions={
          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => setDialogOpen(true)}
          >
            Create Batch
          </Button>
        }
      />

      {/* Batch listing */}
      <DataTable
        columns={[
          ...columns,
          {
            field: 'actions',
            header: 'Actions',
            render: (row) => (
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setSelectedBatch(row);
                  setStudentSearch('');
                }}
              >
                View Students
              </Button>
            ),
          },
        ]}
        rows={(list.rows || []).map((row) => ({
          ...row,
          counts: batchCounts[row._id] || {
            expected: 0,
            received: 0,
            missing: 0,
          },
        }))}
        total={list.total}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        params={list.params}
        onParamsChange={list.setParams}
        searchPlaceholder="Search university, course or exam term"
        emptyText="No inward batches found"
      />

      {/* Selected batch students */}
      {selectedBatch && (
        <Box sx={{ mt: 4 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Expected Students
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Batch: {selectedBatch.examTerm || '—'} | {selectedBatch.documentType || '—'}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              onClick={() => {
                setSelectedBatch(null);
                setExpectedStudents([]);
                setStudentSearch('');
              }}
            >
              Close Students
            </Button>
          </Stack>

          {/* Student counts */}
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
            <Chip label={`Expected: ${totalExpected}`} color="info" />

            <Chip label={`Received: ${totalReceived}`} color="success" />

            <Chip label={`Missing: ${totalMissing}`} color="error" />
          </Stack>

          <TextField
            fullWidth
            size="small"
            placeholder="Search name, scholar no., roll no. or enrollment no."
            value={studentSearch}
            onChange={(event) => setStudentSearch(event.target.value)}
            sx={{ mb: 2 }}
          />

          {studentsLoading ? (
            <Typography sx={{ py: 3 }} textAlign="center">
              Loading students...
            </Typography>
          ) : studentsError ? (
            <Box sx={{ py: 3 }}>
              <Typography color="error" sx={{ mb: 1 }}>
                {studentsError}
              </Typography>

              <Button
                variant="outlined"
                onClick={() => {
                  setSelectedBatch({ ...selectedBatch });
                }}
              >
                Retry
              </Button>
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student Name</TableCell>
                    <TableCell>Scholar No.</TableCell>
                    <TableCell>Roll No.</TableCell>
                    <TableCell>Enrollment No.</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Document Serial No.</TableCell>
                    <TableCell>Almirah No.</TableCell>
                    <TableCell>File No.</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell>{student.studentName}</TableCell>

                        <TableCell>{student.scholarNo}</TableCell>

                        <TableCell>{student.rollNo}</TableCell>

                        <TableCell>{student.enrollmentNo}</TableCell>

                        <TableCell>
                          <Chip
                            size="small"
                            label={student.status || '—'}
                            color={
                              student.status === 'In custody'
                                ? 'success'
                                : student.status === 'Missing' || student.status === 'Not received'
                                  ? 'error'
                                  : 'info'
                            }
                          />
                        </TableCell>

                        <TableCell>{student.documentSerialNo || '—'}</TableCell>

                        <TableCell>{student.almirahNo || '—'}</TableCell>

                        <TableCell>{student.fileNo || '—'}</TableCell>

                        <TableCell>
                          {student.status === 'Expected' ? (
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleOpenReceiveDialog(student)}
                              >
                                Receive
                              </Button>

                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => handleOpenMarkMissing(student)}
                              >
                                Mark Missing
                              </Button>
                            </Stack>
                          ) : student.status === 'In custody' ? (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleOpenEditReceipt(student)}
                            >
                              Edit Receipt
                            </Button>
                          ) : (
                            <Chip size="small" label="Pending" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No students found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
              Missing Documents
            </Typography>

            {missingLoading ? (
              <Typography sx={{ py: 2 }}>Loading missing documents...</Typography>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Document Type</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Follow-up Date</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {missingRows.length > 0 ? (
                      missingRows.map((row) => {
                        const details = row.missingDetails || row;

                        return (
                          <TableRow key={getMissingId(row)}>
                            <TableCell>{row.studentId?.name || row.studentName || '—'}</TableCell>

                            <TableCell>{row.documentType || '—'}</TableCell>

                            <TableCell>
                              {details.reason === 'OTHER'
                                ? details.otherReason || 'Other'
                                : MISSING_REASONS.find((item) => item.value === details.reason)
                                    ?.label ||
                                  details.reason ||
                                  '—'}
                            </TableCell>

                            <TableCell>
                              {details.followUpDate
                                ? String(details.followUpDate).slice(0, 10)
                                : '—'}
                            </TableCell>

                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleOpenUpdateMissing(row)}
                              >
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No missing documents found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ sm: 'center' }}
          spacing={2}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6" fontWeight={600}>
            Pending Inward Documents
          </Typography>

          <Button
            variant="outlined"
            onClick={() => loadPendingDocuments(pendingSearch)}
            disabled={pendingLoading}
          >
            Refresh
          </Button>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Search pending documents"
            value={pendingSearch}
            onChange={(event) => setPendingSearch(event.target.value)}
          />

          <Button
            variant="contained"
            onClick={() => loadPendingDocuments(pendingSearch)}
            disabled={pendingLoading}
          >
            Search
          </Button>
        </Stack>

        {pendingError && (
          <Typography color="error" sx={{ mb: 2 }}>
            {pendingError}
          </Typography>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Scholar No.</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {pendingLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    Loading pending documents...
                  </TableCell>
                </TableRow>
              ) : pendingRows.length > 0 ? (
                pendingRows.map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row.studentId?.name || row.studentName || '—'}</TableCell>

                    <TableCell>{row.studentId?.scholarNo || row.scholarNo || '—'}</TableCell>

                    <TableCell>{row.documentType || '—'}</TableCell>

                    <TableCell>
                      <Chip size="small" color="warning" label={row.status || 'Not received'} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No pending documents found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Receive / Edit Receipt Dialog */}
      <Dialog open={receiveDialogOpen} onClose={handleCloseReceiveDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditingReceipt ? 'Edit Receipt' : 'Receive Document'}</DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1, mb: 1 }}>
            Student: {selectedStudent?.studentName || ''}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Roll No: {selectedStudent?.rollNo || '—'}
          </Typography>

          <TextField
            fullWidth
            label="Document Serial Number"
            placeholder="Enter document serial number"
            value={documentSerialNo}
            onChange={(event) => setDocumentSerialNo(event.target.value)}
          />

          <TextField
            fullWidth
            label="Almirah Number"
            placeholder="Enter almirah number"
            value={almirahNo}
            onChange={(event) => setAlmirahNo(event.target.value)}
            sx={{ mt: 2 }}
          />

          <TextField
            fullWidth
            label="File Number"
            placeholder="Enter file number"
            value={fileNo}
            onChange={(event) => setFileNo(event.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseReceiveDialog} disabled={receiptSaving}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSaveReceipt}
            disabled={receiptSaving || !selectedStudent}
          >
            {receiptSaving ? 'Saving...' : isEditingReceipt ? 'Update Receipt' : 'Confirm Received'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={missingDialogOpen} onClose={handleCloseMissingDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingMissing?.missingDetails || editingMissing?.missingId
            ? 'Update Missing Details'
            : 'Mark Document as Missing'}
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            select
            label="Reason"
            value={missingReason}
            onChange={(event) => setMissingReason(event.target.value)}
            sx={{ mt: 2 }}
          >
            {MISSING_REASONS.map((reason) => (
              <MenuItem key={reason.value} value={reason.value}>
                {reason.label}
              </MenuItem>
            ))}
          </TextField>

          {missingReason === 'OTHER' && (
            <TextField
              fullWidth
              label="Other Reason"
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value)}
              sx={{ mt: 2 }}
            />
          )}

          <TextField
            fullWidth
            type="date"
            label="Follow-up Date"
            value={followUpDate}
            onChange={(event) => setFollowUpDate(event.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseMissingDialog} disabled={missingSaving}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleSaveMissing} disabled={missingSaving}>
            {missingSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Batch Dialog */}
      <FormDialog
        open={dialogOpen}
        title="Create Inward Batch"
        defaultValues={INITIAL_VALUES}
        onClose={handleCloseCreateDialog}
        onSubmit={handleCreate}
        submitLabel="Save Batch"
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Batch Information
        </Typography>

        <FormSelect
          name="instituteId"
          label="Institute"
          options={instituteOptions}
          rules={{
            required: 'Select an institute',
          }}
        />

        <FormSelect
          name="universityId"
          label="University"
          options={universityOptions}
          disabled={universityLoading}
          helperText={universityError || (universityLoading ? 'Loading universities...' : '')}
          rules={{
            required: 'Select a university',
          }}
        />

        <CourseField />

        <FormTextField
          name="examTerm"
          label="Exam Term"
          placeholder="e.g. First Year / Semester 1"
          rules={{
            required: 'Enter exam term',
          }}
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelect
              name="examMonth"
              label="Exam Month"
              options={EXAM_MONTHS}
              rules={{
                required: 'Select exam month',
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelect
              name="examYear"
              label="Exam Year"
              options={EXAM_YEARS}
              rules={{
                required: 'Select exam year',
              }}
            />
          </Grid>
        </Grid>

        <FormSelect
          name="documentType"
          label="Document Type"
          options={DOCUMENT_TYPES}
          rules={{
            required: 'Select document type',
          }}
        />

        <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 1 }}>
          Receiving Information
        </Typography>

        <FormDateField
          name="receivedDate"
          label="Received Date"
          rules={{
            required: 'Select received date',
          }}
        />

        <FormTextField
          name="referenceNumber"
          label="Letter / Courier Reference"
          placeholder="Enter reference number"
        />

        {/* Covering letter UI - upload API not yet available */}
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Scanned Covering Letter
          </Typography>

          <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
            Choose PDF
            <input
              hidden
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) {
                  return;
                }

                const error = validateCoveringLetter(file);

                if (error) {
                  setCoveringLetter(null);
                  setCoveringLetterError(error);
                } else {
                  setCoveringLetter(file);
                  setCoveringLetterError('');
                }

                event.target.value = '';
              }}
            />
          </Button>

          {coveringLetterError && (
            <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
              {coveringLetterError}
            </Typography>
          )}

          {coveringLetter && (
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Chip
                label={coveringLetter.name}
                onDelete={() => setCoveringLetter(null)}
                variant="outlined"
              />
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            PDF format only. Backend file upload API is not available yet, so this file is not
            uploaded.
          </Typography>
        </Box>
      </FormDialog>
    </>
  );
}
