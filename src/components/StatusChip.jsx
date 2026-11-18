import { Chip } from '@mui/material';
import { DOCUMENT_STATUS_COLORS, STUDENT_STATUS_COLORS } from '@/constants/statuses';

export default function StatusChip({ status, color: colorOverride, variant }) {
  const color =
    colorOverride ?? STUDENT_STATUS_COLORS[status] ?? DOCUMENT_STATUS_COLORS[status] ?? 'default';

  return <Chip label={status || 'Unknown'} color={color} variant={variant} size="small" />;
}
