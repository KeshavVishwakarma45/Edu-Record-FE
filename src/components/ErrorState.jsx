import { Box, Button, Typography } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import { getErrorMessage } from '@/utils/format';

// Shown when loading failed. Always offer a way to try again.
export default function ErrorState({ error, onRetry }) {
  return (
    <Box role="alert" sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <ErrorOutlineIcon color="error" sx={{ fontSize: 40, mb: 1 }} aria-hidden="true" />
      <Typography sx={{ fontWeight: 600 }}>Could not load this</Typography>
      <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{getErrorMessage(error)}</Typography>
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 2 }}>
          Retry
        </Button>
      )}
    </Box>
  );
}
