import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

import { useFormContext, useWatch } from 'react-hook-form';
import { useEffect as useReactEffect, useState as useReactState } from 'react';

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

import { PERMISSIONS } from '@/constants/permissions';

const DOCUMENT_TYPES = [
  { value: 'Marksheet', label: 'Marksheet' },
  { value: 'Provisional', label: 'Provisional' },
  { value: 'Degree', label: 'Degree' },
  { value: 'Migration', label: 'Migration' },
];

const MISSING_REASONS = [
  { value: 'RESULT_WITHHELD', label: 'Result withheld' },
  { value: 'UNIVERSITY_FEES_DUE', label: 'University fees due' },
  { value: 'ENROLLMENT_PROBLEM', label: 'Enrollment problem' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'NAME_DETAIL_MISMATCH', label: 'Name / detail mismatch' },
  { value: 'NOT_PRINTED', label: 'Not printed' },
  { value: 'OTHER', label: 'Other' },
];

const getRows = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.rows)) return result.rows;
  return [];
};

const getId = (value) => {
  if (!value) return '';
  return typeof value === 'object' ? value._id || value.id || '' : value;
};

const formatDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatReason = (reason, otherReason) => {
  if (reason === 'OTHER') return otherReason || 'Other';

  return MISSING_REASONS.find((item) => item.value === reason)?.label || reason || '—';
};

const getInstituteId = (batch) => getId(batch?.instituteId);

const getStudent = (record) => record?.studentId || {};

const mapStudents = (records) =>
  records.map((record) => {
    const student = getStudent(record);

    return {
      ...record,
      studentName: student.name || '—',
      scholarNo: student.scholarNo || '—',
      rollNo: student.rollNo || '—',
      enrollmentNo: student.enrollmentNo || '—',
      documentSerialNo: record.documentSerialNo || '',
      almirah: record.storageLocation?.almirah || '',
      fileNo: record.storageLocation?.fileNo || '',
    };
  });

const getStatusColor = (status) => {
  if (status === 'In custody') return 'success';
  if (status === 'Not received') return 'warning';
  if (status === 'Expected') return 'default';
  return 'default';
};

const currentYear = new Date().getFullYear();

const INITIAL_VALUES = {
  instituteId: '',
  universityId: '',
  courseId: '',
  examTerm: '',
  examMonth: '',
  examYear: String(currentYear),
  documentType: '',
  receivedDate: null,
  referenceNumber: '',
};

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
].map((label, index) => ({
  value: index + 1,
  label,
}));

const EXAM_YEARS = Array.from({ length: 10 }, (_, index) => {
  const year = currentYear - 4 + index;

  return {
    value: String(year),
    label: String(year),
  };
});

function CourseField() {
  const { control, setValue } = useFormContext();
  const instituteId = useWatch({ control, name: 'instituteId' });

  const [options, setOptions] = useReactState([]);
  const [loading, setLoading] = useReactState(false);
  const [error, setError] = useReactState('');

  useReactEffect(() => {
    let active = true;

    setValue('courseId', '');

    const load = async () => {
      if (!instituteId) {
        setOptions([]);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await coursesApi.list({ page: 1, limit: 100, sort: 'name' }, instituteId);

        if (active) {
          setOptions(
            getRows(result).map((course) => ({
              value: course._id,
              label: `${course.name} (${course.shortCode || ''})`,
            })),
          );
        }
      } catch (err) {
        if (active) {
          setOptions([]);
          setError(err?.message || 'Unable to load courses');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [instituteId, setValue]);

  return (
    <FormSelect
      name="courseId"
      label="Course"
      options={options}
      disabled={!instituteId || loading}
      helperText={error || (loading ? 'Loading courses...' : '')}
      rules={{ required: 'Select a course' }}
    />
  );
}

function StatCard({ label, value, color = 'text.primary' }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800} color={color} sx={{ mt: 0.25 }}>
        {value}
      </Typography>
    </Box>
  );
}

function downloadCsv(rows) {
  if (!rows.length) return;

  const headers = [
    'Roll No.',
    'Student',
    'Scholar No.',
    'Document Type',
    'Reason',
    'Other Reason',
    'Follow-up Date',
  ];

  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const data = rows.map((row) => {
    const student = getStudent(row);
    const details = row.missingDetails || {};

    return [
      student.rollNo,
      student.name,
      student.scholarNo,
      row.documentType,
      details.reason,
      details.otherReason,
      details.followUpDate ? String(details.followUpDate).slice(0, 10) : '',
    ]
      .map(escapeCsv)
      .join(',');
  });

  const csv = [headers.map(escapeCsv).join(','), ...data].join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = 'inward-missing-documents.csv';
  link.click();

  URL.revokeObjectURL(url);
}

export default function InwardBatchesPage() {
  const { selectedInstitute, realInstitutes, allInstitutes, can } = useAuth();

  const notify = useNotify();

  const canRead = can(PERMISSIONS.INWARD_READ);
  const canManage = can(PERMISSIONS.INWARD_MANAGE);

  const list = useList(inwardApi.list, {
    sort: '-createdAt',
  });

  const [batchCounts, setBatchCounts] = useState({});
  const [courseNames, setCourseNames] = useState({});
  const [universityOptions, setUniversityOptions] = useState([]);
  const [universityLoading, setUniversityLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState('');

  const [missingRows, setMissingRows] = useState([]);
  const [missingLoading, setMissingLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('all');
  const [studentSearch, setStudentSearch] = useState('');

  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingReceipt, setEditingReceipt] = useState(false);
  const [receiptSaving, setReceiptSaving] = useState(false);

  const [serialNo, setSerialNo] = useState('');
  const [almirah, setAlmirah] = useState('');
  const [fileNo, setFileNo] = useState('');

  const [missingOpen, setMissingOpen] = useState(false);
  const [editingMissing, setEditingMissing] = useState(null);
  const [missingSaving, setMissingSaving] = useState(false);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [pendingRows, setPendingRows] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');
  const [pendingSearch, setPendingSearch] = useState('');
  const [pendingLoaded, setPendingLoaded] = useState(false);

  const [receiveOldRow, setReceiveOldRow] = useState(null);
  const [targetBatchId, setTargetBatchId] = useState('');
  const [oldSerialNo, setOldSerialNo] = useState('');
  const [oldAlmirah, setOldAlmirah] = useState('');
  const [oldFileNo, setOldFileNo] = useState('');
  const [oldReceiveSaving, setOldReceiveSaving] = useState(false);

  const instituteOptions = useMemo(
    () =>
      (realInstitutes || []).map((item) => ({
        value: item.id,
        label: `${item.shortCode} · ${item.name}`,
      })),
    [realInstitutes],
  );

  const batchInstituteId = getInstituteId(selectedBatch);

  const refreshBatch = useCallback(async () => {
    if (!selectedBatch?._id) return;

    const instituteId = batchInstituteId;

    const [studentResult, missingResult] = await Promise.all([
      inwardApi.getStudents(selectedBatch._id, instituteId),
      inwardApi.getMissing(selectedBatch._id, instituteId),
    ]);

    setStudents(mapStudents(getRows(studentResult)));
    setMissingRows(getRows(missingResult));
    list.reload();
  }, [selectedBatch, batchInstituteId, list]);

  useEffect(() => {
    let active = true;

    const loadUniversities = async () => {
      setUniversityLoading(true);

      try {
        const result = await organisationApi.universities();

        if (active) setUniversityOptions(result || []);
      } catch (error) {
        if (active) notify.error(error);
      } finally {
        if (active) setUniversityLoading(false);
      }
    };

    loadUniversities();

    return () => {
      active = false;
    };
  }, [notify]);

  useEffect(() => {
    let active = true;

    const loadCounts = async () => {
      if (!list.rows.length) {
        setBatchCounts({});
        return;
      }

      const results = await Promise.all(
        list.rows.map(async (batch) => {
          try {
            const counts = await inwardApi.getCounts(batch._id, getInstituteId(batch));

            return [batch._id, counts];
          } catch {
            return [batch._id, null];
          }
        }),
      );

      if (active) setBatchCounts(Object.fromEntries(results));
    };

    loadCounts();

    return () => {
      active = false;
    };
  }, [list.rows]);

  useEffect(() => {
    let active = true;

    const loadCourseNames = async () => {
      const instituteIds = [...new Set(list.rows.map(getInstituteId).filter(Boolean))];

      const results = await Promise.all(
        instituteIds.map(async (id) => {
          try {
            const result = await coursesApi.list({ page: 1, limit: 100, sort: 'name' }, id);

            return getRows(result);
          } catch {
            return [];
          }
        }),
      );

      const map = {};

      results.flat().forEach((course) => {
        map[course._id] = course.name;
      });

      if (active) setCourseNames(map);
    };

    loadCourseNames();

    return () => {
      active = false;
    };
  }, [list.rows]);

  useEffect(() => {
    let active = true;

    const loadDetail = async () => {
      if (!selectedBatch?._id) {
        setStudents([]);
        setMissingRows([]);
        return;
      }

      setStudentsLoading(true);
      setMissingLoading(true);
      setStudentsError('');

      try {
        const [studentResult, missingResult] = await Promise.all([
          inwardApi.getStudents(selectedBatch._id, batchInstituteId),
          inwardApi.getMissing(selectedBatch._id, batchInstituteId),
        ]);

        if (active) {
          setStudents(mapStudents(getRows(studentResult)));
          setMissingRows(getRows(missingResult));
        }
      } catch (error) {
        if (active) {
          setStudentsError(error?.message || 'Unable to load batch students');
          notify.error(error);
        }
      } finally {
        if (active) {
          setStudentsLoading(false);
          setMissingLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      active = false;
    };
  }, [selectedBatch?._id, batchInstituteId, notify]);

  const receivedStudents = useMemo(
    () => students.filter((row) => row.status === 'In custody'),
    [students],
  );

  const missingStudents = useMemo(
    () => students.filter((row) => row.status === 'Not received'),
    [students],
  );

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    let rows = students;

    if (activeTab === 'received') rows = receivedStudents;
    if (activeTab === 'missing') rows = missingStudents;

    if (!search) return rows;

    return rows.filter((row) =>
      [row.studentName, row.scholarNo, row.rollNo, row.enrollmentNo]
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
  }, [students, activeTab, studentSearch, receivedStudents, missingStudents]);

  const loadPending = async (search = pendingSearch) => {
    setPendingLoading(true);
    setPendingError('');

    try {
      const result = await inwardApi.getPending({
        page: 1,
        limit: 100,
        sort: '-createdAt',
        ...(search.trim() ? { search: search.trim() } : {}),
      });

      setPendingRows(getRows(result));
      setPendingLoaded(true);
    } catch (error) {
      setPendingError(error?.message || 'Unable to load pending documents');
      notify.error(error);
    } finally {
      setPendingLoading(false);
    }
  };

  const handleCreate = async (values) => {
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
      ...(values.referenceNumber?.trim() ? { referenceNumber: values.referenceNumber.trim() } : {}),
    };

    try {
      const result = await inwardApi.create(payload, values.instituteId);

      setCreateOpen(false);
      notify.success('Inward batch created successfully');
      list.reload();

      if (result?._id) {
        setSelectedBatch(result);
        setActiveTab('all');
      }
    } catch (error) {
      notify.error(error);
      throw error;
    }
  };

  const openReceive = (student, edit = false) => {
    setSelectedStudent(student);
    setEditingReceipt(edit);
    setSerialNo(student.documentSerialNo || '');
    setAlmirah(student.almirah || '');
    setFileNo(student.fileNo || '');
    setReceiveOpen(true);
  };

  const saveReceipt = async () => {
    if (!selectedStudent || !selectedBatch) return;

    setReceiptSaving(true);

    const payload = {
      documentSerialNo: serialNo.trim(),
      storageLocation: {
        almirah: almirah.trim(),
        fileNo: fileNo.trim(),
      },
    };

    try {
      if (editingReceipt) {
        await inwardApi.updateReceipt(
          selectedBatch._id,
          selectedStudent._id,
          payload,
          batchInstituteId,
        );
      } else {
        const studentId = getId(selectedStudent.studentId);

        if (!studentId) {
          throw new Error('Student ID not found');
        }

        await inwardApi.receive(selectedBatch._id, { studentId, ...payload }, batchInstituteId);
      }

      notify.success(editingReceipt ? 'Receipt updated' : 'Document received');

      setReceiveOpen(false);
      await refreshBatch();
    } catch (error) {
      notify.error(error);
    } finally {
      setReceiptSaving(false);
    }
  };

  const openMissing = (row, edit = false) => {
    const details = row.missingDetails || {};

    setEditingMissing({ row, edit });
    setReason(edit ? details.reason || '' : '');
    setOtherReason(edit ? details.otherReason || '' : '');
    setFollowUpDate(edit && details.followUpDate ? String(details.followUpDate).slice(0, 10) : '');

    setMissingOpen(true);
  };

  const saveMissing = async () => {
    if (!editingMissing || !selectedBatch) return;

    if (!reason || !followUpDate) {
      notify.error('Reason and follow-up date are required');
      return;
    }

    if (reason === 'OTHER' && !otherReason.trim()) {
      notify.error('Please enter the other reason');
      return;
    }

    const row = editingMissing.row;

    const payload = {
      reason,
      followUpDate,
      otherReason: reason === 'OTHER' ? otherReason.trim() : '',
    };

    setMissingSaving(true);

    try {
      if (editingMissing.edit) {
        await inwardApi.updateMissing(selectedBatch._id, row._id, payload, batchInstituteId);
      } else {
        const studentId = getId(row.studentId);

        if (!studentId) throw new Error('Student ID not found');

        await inwardApi.markMissing(selectedBatch._id, { studentId, ...payload }, batchInstituteId);
      }

      notify.success('Missing document details saved');
      setMissingOpen(false);
      await refreshBatch();
    } catch (error) {
      notify.error(error);
    } finally {
      setMissingSaving(false);
    }
  };

  const openReceiveOld = (row) => {
    setReceiveOldRow(row);
    setTargetBatchId('');
    setOldSerialNo('');
    setOldAlmirah('');
    setOldFileNo('');
  };

  const saveReceiveOld = async () => {
    if (!receiveOldRow || !targetBatchId) {
      notify.error('Select the new inward batch');
      return;
    }

    const targetBatch = list.rows.find((batch) => batch._id === targetBatchId);

    if (!targetBatch) {
      notify.error('Selected batch was not found');
      return;
    }

    if (targetBatch.documentType !== receiveOldRow.documentType) {
      notify.error('Document type does not match the selected batch');
      return;
    }

    setOldReceiveSaving(true);

    try {
      await inwardApi.receiveMissing(
        targetBatch._id,
        receiveOldRow._id,
        {
          documentSerialNo: oldSerialNo.trim(),
          storageLocation: {
            almirah: oldAlmirah.trim(),
            fileNo: oldFileNo.trim(),
          },
        },
        getInstituteId(targetBatch),
      );

      notify.success('Previously missing document received');
      setReceiveOldRow(null);
      await loadPending('');
      list.reload();
    } catch (error) {
      notify.error(error);
    } finally {
      setOldReceiveSaving(false);
    }
  };

  const columns = [
    {
      field: 'university',
      header: 'University',
      render: (row) => row.universityId?.name || '—',
    },
    {
      field: 'course',
      header: 'Course',
      render: (row) => {
        const id = getId(row.courseId);
        return row.courseId?.name || courseNames[id] || '—';
      },
    },
    {
      field: 'examTerm',
      header: 'Exam Term',
      render: (row) => row.examTerm || '—',
    },
    {
      field: 'examSession',
      header: 'Exam Session',
      render: (row) =>
        row.examSession ? `${row.examSession.month} / ${row.examSession.year}` : '—',
    },
    {
      field: 'documentType',
      header: 'Document Type',
    },
    {
      field: 'receivedDate',
      header: 'Received Date',
      render: (row) => formatDate(row.receivedDate),
    },
    {
      field: 'counts',
      header: 'Expected / Received / Missing',
      render: (row) => {
        const counts = batchCounts[row._id];

        if (!counts) return '—';

        return `${(counts.expected || 0) + (counts.received || 0) + (counts.missing || 0)} / ${counts.received || 0} / ${counts.missing || 0}`;
      },
    },
  ];

  if (!canRead) {
    return <Alert severity="error">You do not have permission to view inward batches.</Alert>;
  }

  const batchTotal = students.length;

  const receivedCount = receivedStudents.length;
  const missingCount = missingStudents.length;
  const progress = batchTotal > 0 ? (receivedCount / batchTotal) * 100 : 0;

  const formDefaults = {
    ...INITIAL_VALUES,
    instituteId: allInstitutes ? '' : selectedInstitute?.id || '',
  };

  return (
    <Box>
      {!selectedBatch ? (
        <>
          <PageHeader
            title="University document inward"
            subtitle={
              selectedInstitute?.name
                ? `Inward batches for ${selectedInstitute.name}`
                : 'Inward batches for all institutes'
            }
            backTo="/"
            actions={
              canManage && (
                <Button
                  variant="contained"
                  startIcon={<AddOutlinedIcon />}
                  onClick={() => setCreateOpen(true)}
                >
                  Create Batch
                </Button>
              )
            }
          />

          <DataTable
            columns={columns}
            rows={list.rows}
            total={list.total}
            loading={list.loading}
            error={list.error}
            onRetry={list.reload}
            params={list.params}
            onParamsChange={list.setParams}
            searchPlaceholder="Search university, course or exam term"
            emptyText="No inward batches found"
            onRowClick={(row) => setSelectedBatch(row)}
            rowActions={[
              {
                label: 'View students',
                icon: AddOutlinedIcon,
                onClick: (row) => setSelectedBatch(row),
              },
            ]}
          />

          <Box sx={{ mt: 3 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ sm: 'center' }}
              spacing={1}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Pending inward documents
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Missing documents from earlier batches
                </Typography>
              </Box>

              <Button variant="outlined" onClick={() => loadPending('')} disabled={pendingLoading}>
                {pendingLoaded ? 'Refresh pending list' : 'Load pending list'}
              </Button>
            </Stack>

            {pendingLoaded && (
              <>
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
                    onClick={() => loadPending()}
                    disabled={pendingLoading}
                  >
                    Search
                  </Button>
                </Stack>

                {pendingError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {pendingError}
                  </Alert>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Roll No.</TableCell>
                        <TableCell>Student</TableCell>
                        <TableCell>Document</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell>Follow-up</TableCell>
                        <TableCell>Original Batch</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {pendingLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            <CircularProgress size={22} />
                          </TableCell>
                        </TableRow>
                      ) : pendingRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center">
                            No pending documents
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingRows.map((row) => (
                          <TableRow key={row._id}>
                            <TableCell>{getStudent(row).rollNo || '—'}</TableCell>
                            <TableCell>{getStudent(row).name || '—'}</TableCell>
                            <TableCell>{row.documentType}</TableCell>
                            <TableCell>
                              {formatReason(
                                row.missingDetails?.reason,
                                row.missingDetails?.otherReason,
                              )}
                            </TableCell>
                            <TableCell>{formatDate(row.missingDetails?.followUpDate)}</TableCell>
                            <TableCell>{row.batchId?.examTerm || '—'}</TableCell>
                            <TableCell>
                              {canManage && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => openReceiveOld(row)}
                                >
                                  Receive in new batch
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </>
      ) : (
        <>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => {
              setSelectedBatch(null);
              setActiveTab('all');
              setStudentSearch('');
            }}
            sx={{ mb: 2 }}
          >
            Back to inward batches
          </Button>

          <PageHeader
            title={`${selectedBatch.courseId?.name || courseNames[getId(selectedBatch.courseId)] || 'Course'} · ${selectedBatch.examTerm} · ${selectedBatch.documentType}`}
            subtitle={`${selectedBatch.universityId?.name || 'University'} · received ${formatDate(selectedBatch.receivedDate)} · courier ref ${selectedBatch.referenceNumber || '—'}`}
            actions={<Chip label={selectedBatch.documentType} color="primary" variant="outlined" />}
          />

          <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Expected" value={batchTotal} />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Received" value={receivedCount} color="primary.main" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Missing" value={missingCount} color="warning.main" />
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <StatCard label="Received progress" value={`${Math.round(progress)}%`} />
              </Grid>
            </Grid>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mt: 2,
                height: 7,
                borderRadius: 5,
                backgroundColor: '#ffe0c2',
              }}
            />
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 2.5 }}>
            <Typography fontWeight={700} sx={{ mb: 1.5 }}>
              Find student document
            </Typography>

            <TextField
              fullWidth
              size="small"
              placeholder="Search name, roll no., scholar no. or enrollment no."
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
            />
          </Paper>

          <Paper variant="outlined">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
                p: 1.5,
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(_event, value) => setActiveTab(value)}
                variant="scrollable"
              >
                <Tab value="all" label={`All ${students.length}`} />
                <Tab value="received" label={`Received ${receivedCount}`} />
                <Tab value="missing" label={`Missing ${missingCount}`} />
              </Tabs>

              {activeTab === 'missing' && (
                <Button
                  variant="outlined"
                  startIcon={<DownloadOutlinedIcon />}
                  disabled={missingRows.length === 0}
                  onClick={() => downloadCsv(missingRows)}
                >
                  Download missing list
                </Button>
              )}
            </Box>

            <Divider />

            {studentsLoading || missingLoading ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : studentsError ? (
              <Alert severity="error" sx={{ m: 2 }}>
                {studentsError}
                <Button onClick={refreshBatch}>Retry</Button>
              </Alert>
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Roll No.</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Scholar No.</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Follow-up</TableCell>
                      <TableCell>Serial No.</TableCell>
                      <TableCell>Storage</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((row) => {
                        const missing = row.missingDetails || {};

                        return (
                          <TableRow key={row._id} hover>
                            <TableCell>{row.rollNo}</TableCell>
                            <TableCell>{row.studentName}</TableCell>
                            <TableCell>{row.scholarNo}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={row.status}
                                color={getStatusColor(row.status)}
                              />
                            </TableCell>
                            <TableCell>
                              {row.status === 'Not received'
                                ? formatReason(missing.reason, missing.otherReason)
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {row.status === 'Not received'
                                ? formatDate(missing.followUpDate)
                                : '—'}
                            </TableCell>
                            <TableCell>{row.documentSerialNo || '—'}</TableCell>
                            <TableCell>
                              {row.almirah || row.fileNo
                                ? `${row.almirah || '—'} / ${row.fileNo || '—'}`
                                : '—'}
                            </TableCell>
                            <TableCell>
                              {canManage && row.status === 'Expected' && (
                                <Stack direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => openReceive(row)}
                                  >
                                    Receive
                                  </Button>
                                  <Button
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    onClick={() => openMissing(row)}
                                  >
                                    Missing
                                  </Button>
                                </Stack>
                              )}

                              {canManage && row.status === 'In custody' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => openReceive(row, true)}
                                >
                                  Edit receipt
                                </Button>
                              )}

                              {canManage && row.status === 'Not received' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => openMissing(row, true)}
                                >
                                  Update reason
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ mt: 2.5 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                p: 2,
              }}
            >
              <Box>
                <Typography fontWeight={700}>Missing documents</Typography>
                <Typography variant="body2" color="text.secondary">
                  Missing documents stay on the pending list until received.
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<DownloadOutlinedIcon />}
                disabled={!missingRows.length}
                onClick={() => downloadCsv(missingRows)}
              >
                Download missing list
              </Button>
            </Box>

            <Divider />

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Roll No.</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Follow-up date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {missingRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No missing documents in this batch
                      </TableCell>
                    </TableRow>
                  ) : (
                    missingRows.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>{getStudent(row).rollNo || '—'}</TableCell>
                        <TableCell>{getStudent(row).name || '—'}</TableCell>
                        <TableCell>
                          {formatReason(
                            row.missingDetails?.reason,
                            row.missingDetails?.otherReason,
                          )}
                        </TableCell>
                        <TableCell>{formatDate(row.missingDetails?.followUpDate)}</TableCell>
                        <TableCell>
                          {canManage && (
                            <Button size="small" onClick={() => openMissing(row, true)}>
                              Update
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}

      <FormDialog
        open={createOpen}
        title="Create inward batch"
        defaultValues={formDefaults}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        submitLabel="Create batch"
        maxWidth="sm"
      >
        <FormSelect
          name="instituteId"
          label="Institute"
          options={instituteOptions}
          disabled={!allInstitutes}
          rules={{ required: 'Select an institute' }}
        />

        <FormSelect
          name="universityId"
          label="University"
          options={universityOptions.map((item) => ({
            value: item._id,
            label: item.name,
          }))}
          disabled={universityLoading}
          rules={{ required: 'Select a university' }}
        />

        <CourseField />

        <FormTextField
          name="examTerm"
          label="Exam term"
          placeholder="e.g. BCA Year I"
          rules={{ required: 'Enter exam term' }}
        />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelect
              name="examMonth"
              label="Exam month"
              options={EXAM_MONTHS}
              rules={{ required: 'Select exam month' }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelect
              name="examYear"
              label="Exam year"
              options={EXAM_YEARS}
              rules={{ required: 'Select exam year' }}
            />
          </Grid>
        </Grid>

        <FormSelect
          name="documentType"
          label="Document type"
          options={DOCUMENT_TYPES}
          rules={{ required: 'Select document type' }}
        />

        <FormDateField
          name="receivedDate"
          label="Received date"
          rules={{ required: 'Select received date' }}
        />

        <FormTextField name="referenceNumber" label="Courier / letter reference" />

        <Alert severity="info">
          The backend currently has no covering-letter upload endpoint. The batch can be created
          with a reference number, but a PDF cannot yet be uploaded.
        </Alert>
      </FormDialog>

      <FormDialog
        open={receiveOpen}
        title={editingReceipt ? 'Edit received document' : 'Mark document received'}
        defaultValues={{}}
        onClose={() => setReceiveOpen(false)}
        onSubmit={saveReceipt}
        submitLabel={editingReceipt ? 'Save changes' : 'Mark received'}
      >
        <Alert severity="info">
          {selectedStudent?.studentName} · Roll no. {selectedStudent?.rollNo}
        </Alert>

        <TextField
          fullWidth
          label="Document serial number"
          value={serialNo}
          onChange={(event) => setSerialNo(event.target.value)}
        />

        <TextField
          fullWidth
          label="Almirah"
          value={almirah}
          onChange={(event) => setAlmirah(event.target.value)}
        />

        <TextField
          fullWidth
          label="File number"
          value={fileNo}
          onChange={(event) => setFileNo(event.target.value)}
        />

        {receiptSaving && <LinearProgress />}
      </FormDialog>

      <FormDialog
        open={missingOpen}
        title={
          editingMissing?.edit ? 'Update missing document details' : 'Mark document as missing'
        }
        defaultValues={{}}
        onClose={() => setMissingOpen(false)}
        onSubmit={saveMissing}
        submitLabel="Save reason"
      >
        <TextField
          fullWidth
          select
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
        >
          {MISSING_REASONS.map((item) => (
            <MenuItem key={item.value} value={item.value}>
              {item.label}
            </MenuItem>
          ))}
        </TextField>

        {reason === 'OTHER' && (
          <TextField
            fullWidth
            label="Other reason"
            value={otherReason}
            onChange={(event) => setOtherReason(event.target.value)}
            required
          />
        )}

        <TextField
          fullWidth
          type="date"
          label="Follow-up date"
          value={followUpDate}
          onChange={(event) => setFollowUpDate(event.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          required
        />

        {missingSaving && <LinearProgress />}
      </FormDialog>

      <FormDialog
        open={Boolean(receiveOldRow)}
        title="Receive previously missing document"
        defaultValues={{}}
        onClose={() => setReceiveOldRow(null)}
        onSubmit={saveReceiveOld}
        submitLabel="Confirm received"
      >
        <Alert severity="info">
          {getStudent(receiveOldRow)?.name || 'Student'} · {receiveOldRow?.documentType}
        </Alert>

        <TextField
          fullWidth
          select
          label="New inward batch"
          value={targetBatchId}
          onChange={(event) => setTargetBatchId(event.target.value)}
          required
        >
          {list.rows
            .filter((batch) => batch.documentType === receiveOldRow?.documentType)
            .map((batch) => (
              <MenuItem key={batch._id} value={batch._id}>
                {batch.examTerm} · {batch.documentType} · {batch.examSession?.month}/
                {batch.examSession?.year}
              </MenuItem>
            ))}
        </TextField>

        <TextField
          fullWidth
          label="Document serial number"
          value={oldSerialNo}
          onChange={(event) => setOldSerialNo(event.target.value)}
        />

        <TextField
          fullWidth
          label="Almirah"
          value={oldAlmirah}
          onChange={(event) => setOldAlmirah(event.target.value)}
        />

        <TextField
          fullWidth
          label="File number"
          value={oldFileNo}
          onChange={(event) => setOldFileNo(event.target.value)}
        />

        {oldReceiveSaving && <LinearProgress />}
      </FormDialog>
    </Box>
  );
}
