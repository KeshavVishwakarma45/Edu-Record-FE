import { Chip } from '@mui/material';
import { DOCUMENT_STATUS_COLORS } from '@/constants/statuses';

// A document status with its fixed colour, e.g. <StatusChip status={DOCUMENT_STATUSES.IN_CUSTODY} />
export default function StatusChip({ status }) {
  return <Chip label={status} color={DOCUMENT_STATUS_COLORS[status] ?? 'default'} size="small" />;
}
