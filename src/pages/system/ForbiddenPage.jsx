import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';

// 403: logged in, but this role may not open the page in the selected institute.
export default function ForbiddenPage() {
  const { currentRoleName, selectedInstitute } = useAuth();
  return (
    <Box sx={{ py: 8, textAlign: 'center' }}>
      <Typography variant="h5" component="h1">
        No access
      </Typography>
      <Typography sx={{ color: 'text.secondary', mt: 1 }}>
        As {currentRoleName ?? 'a user without a role'}
        {selectedInstitute ? ` in ${selectedInstitute.shortCode}` : ''}, you cannot open this page.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 3 }}>
        Go to dashboard
      </Button>
    </Box>
  );
}
