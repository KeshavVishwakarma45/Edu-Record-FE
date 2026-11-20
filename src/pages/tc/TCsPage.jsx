import { useState } from 'react';
import {
  Alert,
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
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

import { tcsApi } from '@/api/tcs';
import { PERMISSIONS } from '@/constants/permissions';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

const EMPTY_FORM = {
  studentName: '',
  admissionNo: '',
  course: '',
  academicYear: '',
  reasonForLeaving: '',
  conduct: '',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
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

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN');
};

const columns = [
  { field: 'studentName', header: 'Student Name' },
  { field: 'admissionNo', header: 'Admission No.' },
  { field: 'course', header: 'Course' },
  {
    field: 'academicYear',
    header: 'Academic Year',
    render: (row) => row.academicYear || '—',
  },
  {
    field: 'status',
    header: 'Status',
    render: (row) => (
      <Chip size="small" label={statusLabel(row.status)} color={statusColor(row.status)} />
    ),
  },
  {
    field: 'createdAt',
    header: 'Created At',
    render: (row) => formatDate(row.createdAt),
  },
];

export default function TCsPage() {
  const notify = useNotify();
  const { can } = useAuth();

  const canCreate = can(PERMISSIONS.TC_DRAFT);
  const canApprove = can(PERMISSIONS.TC_APPROVE);
  const canIssue = can(PERMISSIONS.TC_ISSUE);

  const list = useList(tcsApi.list, { sort: '-createdAt' });

  const createRequest = useRequest(tcsApi.create);
  const updateRequest = useRequest(tcsApi.update);
  const submitRequest = useRequest(tcsApi.submit);
  const approveRequest = useRequest(tcsApi.approve);
  const rejectRequest = useRequest(tcsApi.reject);
  const issueRequest = useRequest(tcsApi.issue);

  const [status, setStatus] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [selectedTC, setSelectedTC] = useState(null);
  const [editReason, setEditReason] = useState('');
  const [editConduct, setEditConduct] = useState('');

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionRemark, setRejectionRemark] = useState('');

  const [pdfOpen, setPdfOpen] = useState(false);

  const [issueOpen, setIssueOpen] = useState(false);
  const [receivedBy, setReceivedBy] = useState('');
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [studentSignature, setStudentSignature] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [tcHistory, setTcHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedStatus = normalizeStatus(selectedTC?.status);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const closeDetails = () => {
    setSelectedTC(null);
    setRejectOpen(false);
    setPdfOpen(false);
    setIssueOpen(false);
    setHistoryOpen(false);
    setRejectionRemark('');
  };

  const openDetails = (tc) => {
    setSelectedTC(tc);
    setEditReason(tc.reasonForLeaving || '');
    setEditConduct(tc.conduct || '');
  };

  const handleCreate = async () => {
    if (!canCreate) return;

    if (!form.studentName.trim() || !form.admissionNo.trim() || !form.course.trim()) {
      notify.error('Student name, admission number and course are required');
      return;
    }

    try {
      await createRequest.run(form);
      notify.success('TC draft created');
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedTC || !canCreate) return;

    try {
      const updated = await updateRequest.run(selectedTC._id, {
        reasonForLeaving: editReason,
        conduct: editConduct,
      });

      if (updated) setSelectedTC(updated);
      notify.success('TC draft updated');
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTC || !canCreate) return;
    try {
      await submitRequest.run(selectedTC._id);
      notify.success('TC submitted for approval');
      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleApprove = async () => {
    if (!selectedTC || !canApprove) return;

    try {
      await approveRequest.run(selectedTC._id);
      notify.success('TC approved successfully');
      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleReject = async () => {
    if (!selectedTC || !canApprove) return;

    if (!rejectionRemark.trim()) {
      notify.error('Rejection remark is required');
      return;
    }

    try {
      await rejectRequest.run(selectedTC._id, rejectionRemark);
      notify.success('TC rejected');
      closeDetails();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleIssue = async () => {
    if (!selectedTC || !canIssue) return;

    if (!receivedBy.trim() || !studentPhoto || !studentSignature) {
      notify.error('Received By, student photo and signature are required');
      return;
    }

    try {
      await issueRequest.run(selectedTC._id, {
        receivedBy,
        studentPhoto,
        studentSignature,
      });

      notify.success('TC issued successfully');
      setReceivedBy('');
      setStudentPhoto(null);
      setStudentSignature(null);
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
      const result = await tcsApi.history(selectedTC._id);
      setTcHistory(Array.isArray(result) ? result : result?.rows || result?.history || []);
      setHistoryOpen(true);
    } catch (error) {
      notify.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const rowActions = [
    {
      label: 'View',
      icon: VisibilityOutlinedIcon,
      onClick: openDetails,
    },
  ];

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
        subtitle="Manage TC drafts, approvals and student handovers"
        actions={
          canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
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
            list.setParams({ status: value || undefined, page: 1 });
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
        searchPlaceholder="Search student, admission no. or TC ID"
        emptyText="No TC records found"
      />

      {/* CREATE TC */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Transfer Certificate</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Student Name"
              value={form.studentName}
              onChange={(event) => updateForm('studentName', event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Admission Number"
              value={form.admissionNo}
              onChange={(event) => updateForm('admissionNo', event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Course"
              value={form.course}
              onChange={(event) => updateForm('course', event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Academic Year"
              value={form.academicYear}
              onChange={(event) => updateForm('academicYear', event.target.value)}
              fullWidth
            />
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
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!canCreate || createRequest.loading}
          >
            Save Draft
          </Button>
        </DialogActions>
      </Dialog>

      {/* TC DETAILS */}
      <Dialog open={Boolean(selectedTC)} onClose={closeDetails} fullWidth maxWidth="md">
        <DialogTitle>Transfer Certificate Details</DialogTitle>
        <DialogContent dividers>
          {selectedTC && (
            <Stack spacing={2}>
              <Typography variant="h6">Student Information</Typography>
              <Typography>Student Name: {selectedTC.studentName}</Typography>
              <Typography>Admission Number: {selectedTC.admissionNo}</Typography>
              <Typography>Course: {selectedTC.course}</Typography>
              <Typography>Academic Year: {selectedTC.academicYear || '—'}</Typography>

              <Divider />

              <Typography variant="h6">TC Information</Typography>

              {selectedStatus === 'draft' ? (
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
                  <Typography>Reason for Leaving: {selectedTC.reasonForLeaving || '—'}</Typography>
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
              {selectedTC.rejectionRemark && (
                <Alert severity="error">Rejection Remark: {selectedTC.rejectionRemark}</Alert>
              )}
              {selectedTC.receivedBy && (
                <Typography>Received By: {selectedTC.receivedBy}</Typography>
              )}
              {selectedTC.issuedAt && (
                <Typography>Issued At: {formatDate(selectedTC.issuedAt)}</Typography>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ flexWrap: 'wrap', gap: 1, p: 2 }}>
          <Button onClick={handleHistory} disabled={historyLoading || busy}>
            {historyLoading ? 'Loading History...' : 'View History'}
          </Button>

          {selectedStatus === 'draft' && (
            <>
              <Button onClick={handleSaveDraft} disabled={!canCreate || busy}>
                Save Changes
              </Button>
              <Button variant="contained" onClick={handleSubmit} disabled={!canCreate || busy}>
                Submit for Approval
              </Button>
            </>
          )}

          {selectedStatus === 'pending_approval' && (
            <>
              <Button
                color="error"
                variant="outlined"
                onClick={() => setRejectOpen(true)}
                disabled={!canApprove || busy}
              >
                Reject
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={handleApprove}
                disabled={!canApprove || busy}
              >
                Approve
              </Button>
              {!canApprove && (
                <Typography variant="caption" color="error">
                  TC_APPROVE permission required
                </Typography>
              )}
            </>
          )}

          {(selectedStatus === 'approved' || selectedStatus === 'issued') && (
            <Button variant="contained" onClick={() => setPdfOpen(true)}>
              Preview TC PDF
            </Button>
          )}

          {selectedStatus === 'approved' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => setIssueOpen(true)}
              disabled={!canIssue || busy}
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
            label="Rejection Remark"
            value={rejectionRemark}
            onChange={(event) => setRejectionRemark(event.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleReject}
            disabled={!rejectionRemark.trim() || busy || !canApprove}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* PDF PREVIEW */}
      <Dialog open={pdfOpen} onClose={() => setPdfOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Transfer Certificate Preview</DialogTitle>
        <DialogContent dividers>
          {selectedTC && (
            <Box
              id="tc-print-area"
              sx={{
                p: { xs: 2, sm: 4 },
                border: '1px solid #999',
                backgroundColor: 'white',
                color: '#222',
                minHeight: 600,
              }}
            >
              <Typography variant="h5" align="center" fontWeight="bold">
                {selectedTC.instituteName || 'SSISM'}
              </Typography>
              <Typography align="center" fontWeight="bold">
                TRANSFER CERTIFICATE
              </Typography>
              <Divider sx={{ my: 2, borderColor: '#555' }} />

              <Stack spacing={1}>
                <Typography>Reference No.: {selectedTC.refNo || '—'}</Typography>
                <Typography>Book Serial: {selectedTC.bookSerial || '—'}</Typography>
                <Typography>Student Name: {selectedTC.studentName}</Typography>
                <Typography>Admission No.: {selectedTC.admissionNo}</Typography>
                <Typography>Course: {selectedTC.course}</Typography>
                <Typography>Academic Year: {selectedTC.academicYear || '—'}</Typography>
                <Typography>Reason for Leaving: {selectedTC.reasonForLeaving || '—'}</Typography>
                <Typography>Conduct: {selectedTC.conduct || '—'}</Typography>
              </Stack>

              <Divider sx={{ my: 3, borderColor: '#555' }} />
              <Typography align="center" fontWeight="bold">
                CHARACTER CERTIFICATE
              </Typography>
              <Typography sx={{ mt: 2 }}>
                This is to certify that the conduct of {selectedTC.studentName} during the period of
                study was {selectedTC.conduct || 'not specified'}.
              </Typography>
              <Box sx={{ mt: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <Typography>Principal Signature</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPdfOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => window.print()}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      {/* ISSUE TC */}
      <Dialog open={issueOpen} onClose={() => setIssueOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Issue Transfer Certificate</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Received By"
              value={receivedBy}
              onChange={(event) => setReceivedBy(event.target.value)}
              required
            />

            <Button component="label" variant="outlined">
              Upload Student Photo
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => setStudentPhoto(event.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="body2">{studentPhoto?.name || 'No photo selected'}</Typography>

            <Button component="label" variant="outlined">
              Upload Student Signature
              <input
                hidden
                type="file"
                accept="image/*"
                onChange={(event) => setStudentSignature(event.target.files?.[0] || null)}
              />
            </Button>
            <Typography variant="body2">
              {studentSignature?.name || 'No signature selected'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleIssue}
            disabled={!receivedBy.trim() || !studentPhoto || !studentSignature || !canIssue || busy}
          >
            Confirm Issue
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
                  <Typography fontWeight="bold">
                    {item.action || item.event || 'Workflow update'}
                  </Typography>
                  {item.remark && <Typography variant="body2">Remark: {item.remark}</Typography>}
                  {item.performedBy && (
                    <Typography variant="body2">By: {item.performedBy}</Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.at || item.createdAt)}
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
