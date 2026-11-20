import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { reportsApi } from '@/api/reports';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

// Backend reason codes and their readable labels
const REASON_OPTIONS = [
  { value: 'RESULT_WITHHELD', label: 'Result Withheld' },
  { value: 'UNIVERSITY_FEES_DUE', label: 'University Fees Due' },
  { value: 'ENROLLMENT_PROBLEM', label: 'Enrollment Problem' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'NAME_DETAIL_MISMATCH', label: 'Name / Detail Mismatch' },
  { value: 'NOT_PRINTED', label: 'Not Printed' },
  { value: 'OTHER', label: 'Other' },
];

const getReasonLabel = (reason) =>
  REASON_OPTIONS.find((option) => option.value === reason)?.label || reason || '—';

// Format date in IST as dd/mm/yyyy
const formatDate = (value) => {
  if (!value) return '—';

  // Date-only values should not be shifted by timezone conversion
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Date value required by HTML date input
const getDateInputValue = (value) => (value ? String(value).slice(0, 10) : '');

const columns = [
  {
    field: 'studentName',
    header: 'Student Name',
    sortable: true,
    render: (row) => row.student?.name || '—',
  },
  {
    field: 'scholarNo',
    header: 'Scholar No.',
    sortable: true,
    render: (row) => row.student?.scholarNo || '—',
  },
  {
    field: 'admissionNo',
    header: 'Admission No.',
    render: (row) => row.student?.enrollmentNo || '—',
  },
  {
    field: 'courseName',
    header: 'Course',
    render: (row) => row.course?.name || '—',
  },
  {
    field: 'documentType',
    header: 'Pending Document',
    sortable: true,
    render: (row) => row.documentType || '—',
  },
  {
    field: 'receivedDate',
    header: 'Received Date',
    sortable: true,
    render: (row) => formatDate(row.inwardBatch?.receivedDate),
  },
  {
    field: 'reason',
    header: 'Reason',
    render: (row) => (
      <Stack spacing={0.25}>
        <Typography variant="body2">{getReasonLabel(row.reason)}</Typography>
        {row.reason === 'OTHER' && row.otherReason && (
          <Typography variant="caption" color="text.secondary">
            {row.otherReason}
          </Typography>
        )}
      </Stack>
    ),
  },
  {
    field: 'followUpDate',
    header: 'Follow-up Date',
    sortable: true,
    render: (row) => formatDate(row.followUpDate),
  },
];

export default function ReportsPage() {
  const notify = useNotify();

  const list = useList(reportsApi.notReceived, {
    sort: '-createdAt',
  });

  const updateRequest = useRequest(reportsApi.updateFollowUp);

  const [editing, setEditing] = useState(null);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const openEdit = (row) => {
    setEditing(row);
    setReason(row.reason || '');
    setOtherReason(row.otherReason || '');
    setFollowUpDate(getDateInputValue(row.followUpDate));
  };

  const closeEdit = () => {
    setEditing(null);
    setReason('');
    setOtherReason('');
    setFollowUpDate('');
  };

  const handleUpdate = async () => {
    if (!editing) return;

    const originalReason = editing.reason || '';
    const originalOtherReason = editing.otherReason || '';
    const originalDate = getDateInputValue(editing.followUpDate);

    const reasonChanged = reason !== originalReason;
    const otherReasonChanged = otherReason.trim() !== originalOtherReason;
    const dateChanged = followUpDate !== originalDate;

    // At least one field must be changed
    if (!reasonChanged && !otherReasonChanged && !dateChanged) {
      notify.error('Please change at least one field');
      return;
    }

    // Reason validation
    if (reasonChanged && !reason) {
      notify.error('Please select a reason');
      return;
    }

    if (reason === 'OTHER' && (reasonChanged || otherReasonChanged)) {
      if (!otherReason.trim()) {
        notify.error('Please enter the other reason');
        return;
      }

      if (otherReason.trim().length > 250) {
        notify.error('Other reason cannot exceed 250 characters');
        return;
      }
    }

    // Backend does not support clearing an existing follow-up date
    if (originalDate && !followUpDate) {
      notify.error('Follow-up date cannot be cleared');
      return;
    }

    const payload = {};

    // Send reason only when it has changed
    if (reasonChanged || otherReasonChanged) {
      payload.reason = reason;

      if (reason === 'OTHER') {
        payload.otherReason = otherReason.trim();
      }
    }

    // Send date only when it has changed and has a value
    if (dateChanged && followUpDate) {
      payload.followUpDate = followUpDate;
    }

    try {
      await updateRequest.run(editing._id, payload);

      notify.success('Follow-up details updated successfully');

      closeEdit();
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = [
    {
      label: 'Update Follow-up',
      icon: EditOutlinedIcon,
      onClick: openEdit,
    },
  ];

  return (
    <>
      <PageHeader
        title="Not Received Documents"
        subtitle="View pending documents and manage follow-up details"
        backTo="/"
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        This report displays documents that have not been received. You can update their reason and
        follow-up date.
      </Alert>

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
        searchPlaceholder="Search student, scholar no., course or document..."
        emptyText="No pending documents found"
      />

      {/* Update Follow-up Dialog */}
      <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>Update Follow-up Details</DialogTitle>

        <DialogContent>
          {editing && (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2">
                <strong>Student:</strong> {editing.student?.name || '—'}
              </Typography>

              <Typography variant="body2">
                <strong>Scholar No.:</strong> {editing.student?.scholarNo || '—'}
              </Typography>

              <Typography variant="body2">
                <strong>Pending Document:</strong> {editing.documentType || '—'}
              </Typography>

              <TextField
                select
                fullWidth
                label="Reason for Not Receiving"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              >
                {REASON_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              {reason === 'OTHER' && (
                <TextField
                  fullWidth
                  label="Specify Other Reason"
                  value={otherReason}
                  onChange={(event) => setOtherReason(event.target.value)}
                  slotProps={{
                    htmlInput: {
                      maxLength: 250,
                    },
                  }}
                  multiline
                  minRows={2}
                  helperText={`${otherReason.length}/250 characters`}
                  required
                />
              )}

              <TextField
                fullWidth
                type="date"
                label="Follow-up Date"
                value={followUpDate}
                onChange={(event) => setFollowUpDate(event.target.value)}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />

              <Typography variant="caption" color="text.secondary">
                You can update the reason or follow-up date independently. An existing follow-up
                date cannot be cleared.
              </Typography>
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={closeEdit} disabled={updateRequest.loading}>
            Cancel
          </Button>

          <Button variant="contained" onClick={handleUpdate} disabled={updateRequest.loading}>
            {updateRequest.loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
