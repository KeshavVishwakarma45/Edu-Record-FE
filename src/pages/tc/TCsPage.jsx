import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';

import { tcsApi } from '@/api/tcs';
import { studentsApi } from '@/api/students';
import { PERMISSIONS } from '@/constants/permissions';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';
import { formatDate } from '@/utils/format';

const EMPTY_FORM = {
  studentId: '',
  reasonForLeaving: '',
  conduct: '',
};

const EMPTY_STUDENTS = [];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'issued', label: 'Issued' },
];

const normalizeStatus = (status) =>
  String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

const statusLabel = (status) => {
  const value = normalizeStatus(status);

  return STATUS_OPTIONS.find((item) => item.value === value)?.label || status || 'Unknown';
};

const statusColor = (status) => {
  switch (normalizeStatus(status)) {
    case 'pending_approval':
    case 'submitted':
      return 'warning';
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'issued':
      return 'info';
    default:
      return 'default';
  }
};

const getStudentName = (tc) =>
  tc?.studentId?.name || tc?.student?.name || tc?.snapshot?.student?.name || tc?.studentName || '—';

const getScholarNo = (tc) =>
  tc?.studentId?.scholarNo ||
  tc?.student?.scholarNo ||
  tc?.snapshot?.student?.scholarNo ||
  tc?.scholarNo ||
  '—';

const getCourseName = (tc) =>
  tc?.studentId?.courseId?.name ||
  tc?.course?.name ||
  tc?.snapshot?.course?.name ||
  tc?.student?.course?.name ||
  tc?.course?.courseName ||
  tc?.courseName ||
  (typeof tc?.course === 'string' ? tc.course : null) ||
  '—';

const getAcademicYear = (tc) =>
  tc?.studentId?.academicYear ||
  tc?.academicDetails?.academicYear ||
  tc?.snapshot?.academicDetails?.academicYear ||
  tc?.snapshot?.student?.academicYear ||
  tc?.snapshot?.student?.batch ||
  '—';

const normalizeDetails = (result) => {
  const tc = result?.tc || result;

  return {
    ...tc,
    student: result?.student || tc?.student,
    course: result?.course || tc?.course,
    academicDetails: result?.academicDetails || tc?.academicDetails,
    clearanceSummary: result?.clearanceSummary || tc?.clearanceSummary,
  };
};

const columns = [
  {
    field: 'studentName',
    header: 'Student Name',
    render: (row) => getStudentName(row),
  },
  {
    field: 'scholarNo',
    header: 'Scholar No.',
    render: (row) => getScholarNo(row),
  },
  {
    field: 'course',
    header: 'Course',
    render: (row) => getCourseName(row),
  },
  {
    field: 'academicYear',
    header: 'Academic Year',
    render: (row) => getAcademicYear(row),
  },
  {
    field: 'status',
    header: 'Status',
    render: (row) => (
      <Chip size="small" label={statusLabel(row.status)} color={statusColor(row.status)} />
    ),
  },
  {
    field: 'submittedAt',
    header: 'Submitted At',
    render: (row) => formatDate(row.submittedAt),
  },
];

export default function TCsPage() {
  const notify = useNotify();
  const { can, selectedInstitute } = useAuth();

  const canCreate = can(PERMISSIONS.TC_APPLY);
  const canEdit = can(PERMISSIONS.TC_DRAFT);
  const canSubmit = can(PERMISSIONS.TC_APPLY);
  const canApprove = can(PERMISSIONS.TC_APPROVE);
  const canIssue = can(PERMISSIONS.TC_ISSUE);
  const canRead = can(PERMISSIONS.TC_READ);

  const instituteId = selectedInstitute?.id;

  const handoverPhotoInputRef = useRef(null);
  const receiverSignatureInputRef = useRef(null);

  const list = useList(tcsApi.list, {
    page: 1,
    limit: 10,
    sort: '-createdAt',
  });

  const studentsList = useList(studentsApi.list, {
    page: 1,
    limit: 100,
  });

  const createRequest = useRequest(tcsApi.create);
  const updateRequest = useRequest(tcsApi.update);
  const submitRequest = useRequest(tcsApi.submit);
  const approveRequest = useRequest(tcsApi.approve);
  const rejectRequest = useRequest(tcsApi.reject);
  const issueRequest = useRequest(tcsApi.issue);

  const [status, setStatus] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [eligibilityResult, setEligibilityResult] = useState({
    key: '',
    data: null,
    error: '',
  });

  const [selectedTC, setSelectedTC] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [editReason, setEditReason] = useState('');
  const [editConduct, setEditConduct] = useState('');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [pdfOpen, setPdfOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState('');
  const [handoverPhoto, setHandoverPhoto] = useState(null);
  const [receiverSignature, setReceiverSignature] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [tcHistory, setTcHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedStatus = normalizeStatus(selectedTC?.status);

  const students = studentsList.rows ?? EMPTY_STUDENTS;

  const selectedStudent = useMemo(
    () => students.find((student) => student._id === form.studentId) || null,
    [students, form.studentId],
  );

  // Check student TC eligibility whenever student or institute changes.
  const eligibilityKey = form.studentId && instituteId ? `${instituteId}:${form.studentId}` : '';

  useEffect(() => {
    if (!eligibilityKey) return undefined;

    let cancelled = false;

    const checkEligibility = async () => {
      try {
        const result = await tcsApi.getEligibility(form.studentId, instituteId);

        if (!cancelled) {
          setEligibilityResult({
            key: eligibilityKey,
            data: result,
            error: '',
          });
        }
      } catch (error) {
        if (!cancelled) {
          setEligibilityResult({
            key: eligibilityKey,
            data: null,
            error: error?.message || 'Unable to check student TC eligibility.',
          });
        }
      }
    };

    void checkEligibility();

    return () => {
      cancelled = true;
    };
  }, [eligibilityKey, form.studentId, instituteId]);

  const hasCurrentEligibility = Boolean(eligibilityKey) && eligibilityResult.key === eligibilityKey;

  const eligibility = hasCurrentEligibility ? eligibilityResult.data : null;

  const eligibilityError = hasCurrentEligibility ? eligibilityResult.error : '';

  const eligibilityLoading = Boolean(eligibilityKey) && !hasCurrentEligibility;

  // Revoke the previous PDF URL when it changes or the page unmounts.
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setForm(EMPTY_FORM);
  };

  const resetIssueForm = () => {
    setReceivedBy('');
    setHandoverPhoto(null);
    setReceiverSignature(null);

    if (handoverPhotoInputRef.current) {
      handoverPhotoInputRef.current.value = '';
    }

    if (receiverSignatureInputRef.current) {
      receiverSignatureInputRef.current.value = '';
    }
  };

  const closeIssue = () => {
    setIssueOpen(false);
    resetIssueForm();
  };

  const handleClosePdf = () => {
    setPdfOpen(false);
    setPdfUrl('');
  };

  const closeDetails = () => {
    setSelectedTC(null);
    setRejectOpen(false);
    setHistoryOpen(false);
    setRejectionReason('');
    setTcHistory([]);
    setEditReason('');
    setEditConduct('');
    closeIssue();
    handleClosePdf();
  };

  const openDetails = async (row) => {
    setSelectedTC(row);
    setEditReason(row.reasonForLeaving || '');
    setEditConduct(row.conduct || '');
    setDetailsLoading(true);

    try {
      const result = await tcsApi.getById(row._id, instituteId);
      const details = normalizeDetails(result);

      setSelectedTC(details);
      setEditReason(details.reasonForLeaving || '');
      setEditConduct(details.conduct || '');
    } catch (error) {
      notify.error(error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.studentId) {
      notify.error('Please select a student.');
      return;
    }

    if (!instituteId) {
      notify.error('Please select an institute.');
      return;
    }

    if (eligibilityLoading) {
      notify.error('Please wait while student eligibility is being checked.');
      return;
    }

    if (eligibilityError) {
      notify.error('Unable to verify student eligibility. Please try again.');
      return;
    }

    if (!eligibility?.eligible) {
      notify.error('Student is not eligible for Transfer Certificate.');
      return;
    }

    try {
      await createRequest.run(
        {
          studentId: form.studentId,
          reasonForLeaving: form.reasonForLeaving.trim(),
          conduct: form.conduct.trim(),
        },
        instituteId,
      );

      notify.success('TC draft created successfully.');
      closeCreate();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedTC || !canEdit) return;

    try {
      const updated = await updateRequest.run(
        selectedTC._id,
        {
          reasonForLeaving: editReason.trim(),
          conduct: editConduct.trim(),
        },
        instituteId,
      );

      if (updated) {
        setSelectedTC((previous) => ({
          ...previous,
          ...(updated.tc || updated),
        }));
      }

      notify.success('TC draft updated successfully.');
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTC || !canSubmit) return;

    try {
      await submitRequest.run(selectedTC._id, instituteId);

      notify.success('TC submitted for approval.');
      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleApprove = async () => {
    if (!selectedTC || !canApprove) return;

    try {
      const result = await approveRequest.run(selectedTC._id, instituteId);

      const approvedTC = result?.tc || result;

      notify.success(
        `TC approved successfully. Reference: ${
          approvedTC?.refNo || 'Generated'
        }, Serial: ${approvedTC?.bookSerial || 'Generated'}`,
      );

      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleReject = async () => {
    if (!selectedTC || !canApprove) return;

    if (rejectionReason.trim().length < 3) {
      notify.error('Please enter a valid rejection reason.');
      return;
    }

    if (rejectionReason.length > 500) {
      notify.error('Rejection reason cannot exceed 500 characters.');
      return;
    }

    try {
      await rejectRequest.run(selectedTC._id, rejectionReason.trim(), instituteId);

      notify.success('TC rejected successfully.');
      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleIssue = async () => {
    if (!selectedTC || !canIssue) return;

    if (!receivedBy.trim() || !handoverPhoto || !receiverSignature) {
      notify.error('Received By, handover photo and receiver signature are required.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    const maxSize = 2 * 1024 * 1024;

    for (const file of [handoverPhoto, receiverSignature]) {
      if (!allowedTypes.includes(file.type)) {
        notify.error('Only JPG, PNG and WEBP images are allowed.');
        return;
      }

      if (file.size > maxSize) {
        notify.error('Each image must be 2 MB or smaller.');
        return;
      }
    }

    try {
      await issueRequest.run(
        selectedTC._id,
        {
          receivedBy: receivedBy.trim(),
          handoverPhoto,
          receiverSignature,
        },
        instituteId,
      );

      notify.success('TC issued successfully.');
      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleHistory = async () => {
    if (!selectedTC) return;

    try {
      setHistoryLoading(true);

      const result = await tcsApi.history(selectedTC._id, instituteId);

      const history = Array.isArray(result)
        ? result
        : result?.history || result?.rows || result?.activities || [];

      setTcHistory(history);
      setHistoryOpen(true);
    } catch (error) {
      notify.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePdf = async () => {
    if (!selectedTC || !canRead) return;

    try {
      setPdfLoading(true);

      const blob = await tcsApi.getPdf(selectedTC._id, instituteId);

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error('Invalid or empty PDF received from server.');
      }

      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setPdfOpen(true);
    } catch (error) {
      notify.error(error);
    } finally {
      setPdfLoading(false);
    }
  };

  const rowActions = canRead
    ? [
        {
          label: 'View',
          icon: VisibilityOutlinedIcon,
          onClick: openDetails,
        },
      ]
    : [];

  const busy =
    createRequest.loading ||
    updateRequest.loading ||
    submitRequest.loading ||
    approveRequest.loading ||
    rejectRequest.loading ||
    issueRequest.loading;

  return (
    <>
      <PageHeader
        title="Transfer Certificates"
        subtitle={
          selectedInstitute
            ? `Transfer Certificates for ${selectedInstitute.name}`
            : 'Manage TC drafts, approvals and student handovers'
        }
        actions={
          canCreate && (
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              onClick={() => setCreateOpen(true)}
            >
              Create TC
            </Button>
          )
        }
      />

      <Box sx={{ mb: 2, maxWidth: { xs: '100%', sm: 260 } }}>
        <TextField
          select
          fullWidth
          size="small"
          label="Filter by status"
          value={status}
          onChange={(event) => {
            const value = event.target.value;

            setStatus(value);

            list.setParams({
              status: value || undefined,
              page: 1,
            });
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <DataTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        params={list.params}
        onParamsChange={list.setParams}
        rowActions={rowActions}
        searchPlaceholder="Search student, reference number or TC ID"
        emptyText="No transfer certificates found"
      />

      {/* CREATE TC */}
      <Dialog open={createOpen} onClose={closeCreate} fullWidth maxWidth="sm">
        <DialogTitle>Create Transfer Certificate</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={students}
              loading={studentsList.loading}
              value={selectedStudent}
              getOptionLabel={(student) =>
                `${student.name || ''} (${student.scholarNo || 'No Scholar No.'})`
              }
              isOptionEqualToValue={(option, value) => option._id === value._id}
              onChange={(_, student) => updateForm('studentId', student?._id || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Student"
                  required
                  placeholder="Search student name or scholar number"
                />
              )}
            />

            {selectedStudent && (
              <Alert severity="info">
                Selected: {selectedStudent.name} · Scholar No.: {selectedStudent.scholarNo || '—'}
              </Alert>
            )}

            {eligibilityLoading && (
              <Alert severity="info">Checking student clearance eligibility...</Alert>
            )}

            {eligibilityError && <Alert severity="error">{eligibilityError}</Alert>}

            {eligibility && !eligibilityLoading && (
              <Alert severity={eligibility.eligible ? 'success' : 'warning'}>
                {eligibility.eligible
                  ? 'Student is eligible for a Transfer Certificate.'
                  : eligibility.eligibilityStatus === 'no_clearance_application'
                    ? 'No clearance application found for this student. TC cannot be created yet.'
                    : 'Student has pending mandatory clearances.'}

                {!eligibility.eligible && eligibility.pending?.length > 0 && (
                  <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                    {eligibility.pending.map((item, index) => (
                      <li key={item.departmentId || index}>
                        {item.departmentName || 'Department'} — {item.status || 'Pending'}
                      </li>
                    ))}
                  </Box>
                )}
              </Alert>
            )}

            <TextField
              label="Reason for Leaving"
              value={form.reasonForLeaving}
              onChange={(event) => updateForm('reasonForLeaving', event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />

            <TextField
              label="Conduct"
              value={form.conduct}
              onChange={(event) => updateForm('conduct', event.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeCreate}>Cancel</Button>

          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={
              !form.studentId ||
              !eligibility?.eligible ||
              eligibilityLoading ||
              Boolean(eligibilityError) ||
              createRequest.loading
            }
          >
            {createRequest.loading ? 'Creating...' : 'Create Draft'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* TC DETAILS */}
      <Dialog open={Boolean(selectedTC)} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle>Transfer Certificate Details</DialogTitle>

        <DialogContent dividers>
          {detailsLoading ? (
            <Typography color="text.secondary">Loading TC details...</Typography>
          ) : (
            selectedTC && (
              <Stack spacing={2}>
                <Typography variant="h6">Student Information</Typography>

                <Typography>Student Name: {getStudentName(selectedTC)}</Typography>

                <Typography>Scholar Number: {getScholarNo(selectedTC)}</Typography>

                <Typography>Course: {getCourseName(selectedTC)}</Typography>

                <Typography>Academic Year: {getAcademicYear(selectedTC)}</Typography>

                <Divider />

                <Typography variant="h6">TC Information</Typography>

                {selectedStatus === 'draft' && canEdit ? (
                  <>
                    <TextField
                      label="Reason for Leaving"
                      value={editReason}
                      onChange={(event) => setEditReason(event.target.value)}
                      fullWidth
                      multiline
                      minRows={2}
                    />

                    <TextField
                      label="Conduct"
                      value={editConduct}
                      onChange={(event) => setEditConduct(event.target.value)}
                      fullWidth
                    />
                  </>
                ) : (
                  <>
                    <Typography>
                      Reason for Leaving: {selectedTC.reasonForLeaving || '—'}
                    </Typography>

                    <Typography>Conduct: {selectedTC.conduct || '—'}</Typography>
                  </>
                )}

                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography>Status:</Typography>

                  <Chip
                    size="small"
                    label={statusLabel(selectedTC.status)}
                    color={statusColor(selectedTC.status)}
                  />
                </Stack>

                {selectedTC.refNo && <Typography>Reference No.: {selectedTC.refNo}</Typography>}

                {selectedTC.bookSerial && (
                  <Typography>Book Serial: {selectedTC.bookSerial}</Typography>
                )}

                {selectedTC.rejectionReason && (
                  <Alert severity="error">Rejection Reason: {selectedTC.rejectionReason}</Alert>
                )}

                {selectedTC.receivedBy && (
                  <Typography>Received By: {selectedTC.receivedBy}</Typography>
                )}

                {selectedTC.issuedAt && (
                  <Typography>Issued At: {formatDate(selectedTC.issuedAt)}</Typography>
                )}

                {selectedTC.clearanceSummary && (
                  <>
                    <Divider />

                    <Typography variant="h6">Clearance Summary</Typography>

                    <Alert severity="info">
                      {typeof selectedTC.clearanceSummary === 'string'
                        ? selectedTC.clearanceSummary
                        : selectedTC.clearanceSummary.message ||
                          (selectedTC.clearanceSummary.eligible === true
                            ? 'Clearance requirements completed.'
                            : selectedTC.clearanceSummary.eligible === false
                              ? 'Some clearance requirements are pending.'
                              : 'Clearance information is available.')}
                    </Alert>
                  </>
                )}
              </Stack>
            )
          )}
        </DialogContent>

        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
          <Button onClick={handleHistory} disabled={historyLoading || busy || detailsLoading}>
            {historyLoading ? 'Loading History...' : 'View History'}
          </Button>

          {selectedStatus === 'draft' && canEdit && (
            <Button onClick={handleSaveDraft} disabled={busy || detailsLoading}>
              Save Changes
            </Button>
          )}

          {selectedStatus === 'draft' && canSubmit && (
            <Button variant="contained" onClick={handleSubmit} disabled={busy || detailsLoading}>
              Submit for Approval
            </Button>
          )}

          {canApprove &&
            (selectedStatus === 'pending_approval' || selectedStatus === 'submitted') && (
              <>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setRejectOpen(true)}
                  disabled={busy}
                >
                  Reject
                </Button>

                <Button color="success" variant="contained" onClick={handleApprove} disabled={busy}>
                  Approve
                </Button>
              </>
            )}

          {canRead && (selectedStatus === 'approved' || selectedStatus === 'issued') && (
            <Button
              variant="contained"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={handlePdf}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Loading PDF...' : 'View TC PDF'}
            </Button>
          )}

          {selectedStatus === 'approved' && canIssue && (
            <Button
              variant="contained"
              color="success"
              onClick={() => setIssueOpen(true)}
              disabled={busy}
            >
              Issue TC
            </Button>
          )}

          <Button onClick={closeDetails}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* REJECT */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Transfer Certificate</DialogTitle>

        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Please provide a mandatory reason for rejecting this TC.
          </DialogContentText>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            slotProps={{
              htmlInput: { maxLength: 500 },
            }}
            required
            helperText={`${rejectionReason.length}/500 characters`}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleReject}
            disabled={
              rejectionReason.trim().length < 3 ||
              rejectionReason.length > 500 ||
              busy ||
              !canApprove
            }
          >
            {rejectRequest.loading ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* BACKEND PDF */}
      <Dialog open={pdfOpen} onClose={handleClosePdf} fullWidth maxWidth="lg">
        <DialogTitle>Transfer Certificate PDF</DialogTitle>

        <DialogContent dividers sx={{ height: '75vh', p: 0 }}>
          {pdfUrl ? (
            <Box
              component="iframe"
              src={pdfUrl}
              title="Transfer Certificate PDF"
              sx={{
                width: '100%',
                height: '100%',
                border: 0,
              }}
            />
          ) : (
            <Typography sx={{ p: 3 }}>PDF preview unavailable.</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePdf}>Close</Button>

          {pdfUrl && (
            <Button
              variant="contained"
              onClick={() => window.open(pdfUrl, '_blank', 'noopener,noreferrer')}
            >
              Open PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* ISSUE TC */}
      <Dialog open={issueOpen} onClose={closeIssue} maxWidth="sm" fullWidth>
        <DialogTitle>Issue Transfer Certificate</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Received By"
              value={receivedBy}
              onChange={(event) => setReceivedBy(event.target.value)}
              slotProps={{
                htmlInput: { maxLength: 100 },
              }}
              required
            />

            <Button component="label" variant="outlined">
              Upload Handover Photo
              <input
                ref={handoverPhotoInputRef}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setHandoverPhoto(event.target.files?.[0] || null)}
              />
            </Button>

            <Typography variant="body2">
              {handoverPhoto?.name || 'No handover photo selected'}
            </Typography>

            <Button component="label" variant="outlined">
              Upload Receiver Signature
              <input
                ref={receiverSignatureInputRef}
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => setReceiverSignature(event.target.files?.[0] || null)}
              />
            </Button>

            <Typography variant="body2">
              {receiverSignature?.name || 'No receiver signature selected'}
            </Typography>

            <Alert severity="info">
              Both images must be JPG, PNG or WEBP and must not exceed 2 MB each.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeIssue}>Cancel</Button>

          <Button
            variant="contained"
            color="success"
            onClick={handleIssue}
            disabled={
              !receivedBy.trim() || !handoverPhoto || !receiverSignature || !canIssue || busy
            }
          >
            {issueRequest.loading ? 'Issuing...' : 'Confirm Issue'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* HISTORY */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>TC History / Audit Trail</DialogTitle>

        <DialogContent dividers>
          {tcHistory.length === 0 ? (
            <Typography color="text.secondary">No history available.</Typography>
          ) : (
            <Stack spacing={2}>
              {tcHistory.map((item, index) => (
                <Box key={item._id || `${item.action}-${index}`}>
                  <Typography fontWeight="bold">{item.action || 'Workflow update'}</Typography>

                  {item.details?.after?.rejectionReason && (
                    <Typography variant="body2">
                      Rejection Reason: {item.details.after.rejectionReason}
                    </Typography>
                  )}

                  {item.details?.after?.refNo && (
                    <Typography variant="body2">
                      Reference No.: {item.details.after.refNo}
                    </Typography>
                  )}

                  {item.details?.after?.bookSerial && (
                    <Typography variant="body2">
                      Book Serial: {item.details.after.bookSerial}
                    </Typography>
                  )}

                  {item.details?.after?.receivedBy && (
                    <Typography variant="body2">
                      Received By: {item.details.after.receivedBy}
                    </Typography>
                  )}

                  {item.performedBy?.name && (
                    <Typography variant="body2">By: {item.performedBy.name}</Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.timestamp)}
                  </Typography>

                  <Divider sx={{ mt: 1 }} />
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
