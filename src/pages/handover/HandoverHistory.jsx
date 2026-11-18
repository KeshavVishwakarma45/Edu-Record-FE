import { Chip, Stack, TextField, Typography } from '@mui/material';

import DataTable from '@/components/DataTable';
import { useList } from '@/hooks/useList';
import { handoverApi } from '@/api/handover';

function getHandoverHistory(params) {
  if (params.fromDate && params.toDate && params.fromDate > params.toDate) {
    return Promise.resolve({ rows: [], total: 0 });
  }

  return handoverApi.getHistory(params);
}

function formatHandoverDate(row) {
  const dateValue =
    row.handoverAt ||
    (row.handoverDate ? `${row.handoverDate}T${row.handoverTime || '00:00:00'}` : null);

  if (!dateValue) return '-';

  const date = new Date(dateValue);

  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

const columns = [
  {
    field: 'studentName',
    header: 'Student',
    render: (row) => (
      <Stack spacing={0.3}>
        <Typography variant="body2" fontWeight={600}>
          {row.studentName || '-'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {row.enrollmentNumber || '-'}
        </Typography>
      </Stack>
    ),
  },
  {
    field: 'documents',
    header: 'Documents',
    render: (row) =>
      Array.isArray(row.documents) && row.documents.length > 0
        ? row.documents
            .map((doc) => doc.documentName)
            .filter(Boolean)
            .join(', ')
        : '-',
  },
  {
    field: 'receiverName',
    header: 'Received By',
    render: (row) => (
      <Stack spacing={0.3}>
        <Typography variant="body2">{row.receiverName || '-'}</Typography>
        <Typography variant="caption" color="text.secondary">
          {row.receiverType || '-'}
        </Typography>
      </Stack>
    ),
  },
  {
    field: 'issuingStaffName',
    header: 'Issued By',
  },
  {
    field: 'handoverAt',
    header: 'Handover Date',
    render: formatHandoverDate,
  },
  {
    field: 'status',
    header: 'Status',
    render: (row) => (
      <Chip
        label={row.status || 'Unknown'}
        size="small"
        color={row.status === 'Completed' ? 'success' : 'default'}
        variant="outlined"
      />
    ),
  },
];

export default function HandoverHistory() {
  const { rows, total, loading, error, params, setParams, reload } = useList(getHandoverHistory, {
    page: 1,
    limit: 20,
    search: '',
    fromDate: '',
    toDate: '',
  });

  const invalidDateRange = Boolean(
    params.fromDate && params.toDate && params.fromDate > params.toDate,
  );

  const tableRows = rows.map((row) => ({
    ...row,
    _id: row._id || row.handoverId,
  }));

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="From Date"
          type="date"
          size="small"
          value={params.fromDate || ''}
          onChange={(event) => setParams({ fromDate: event.target.value })}
          error={invalidDateRange}
          helperText={invalidDateRange ? 'From Date cannot be later than To Date' : ''}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <TextField
          label="To Date"
          type="date"
          size="small"
          value={params.toDate || ''}
          onChange={(event) => setParams({ toDate: event.target.value })}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      </Stack>

      <DataTable
        columns={columns}
        rows={tableRows}
        total={total}
        loading={loading}
        error={error}
        onRetry={reload}
        params={params}
        onParamsChange={setParams}
        searchPlaceholder="Search by student or receiver"
        emptyText="No handover history found"
        instituteColumn={false}
        instituteFilter={false}
      />
    </Stack>
  );
}
