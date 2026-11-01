import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

// 404: no page at this address.
export default function NotFoundPage() {
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h5" component="h1">
        Page not found
      </Typography>
      <Typography sx={{ color: 'text.secondary', mt: 1 }}>
        There is no page at this address. Check the link or use the menu.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 3 }}>
        Go to dashboard
      </Button>
    </Box>
  );
}
