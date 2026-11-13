import { Chip } from '@mui/material';
import { DOCUMENT_STATUS_COLORS, STUDENT_STATUS_COLORS } from '@/constants/statuses';

export default function StatusChip({ status }) {
  const color = STUDENT_STATUS_COLORS[status] ?? DOCUMENT_STATUS_COLORS[status] ?? 'default';

  return <Chip label={status || 'Unknown'} color={color} size="small" />;
}
