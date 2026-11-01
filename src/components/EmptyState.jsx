import { Box, Typography } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

// Shown when a list has no rows, so the user knows it loaded and is simply empty.
export default function EmptyState({ title = 'Nothing here yet', description, action }) {
  return (
    <Box sx={{ py: 6, px: 2, textAlign: 'center', color: 'text.secondary' }}>
      <InboxOutlinedIcon sx={{ fontSize: 40, mb: 1 }} aria-hidden="true" />
      <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
      {description && <Typography sx={{ mt: 0.5 }}>{description}</Typography>}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
