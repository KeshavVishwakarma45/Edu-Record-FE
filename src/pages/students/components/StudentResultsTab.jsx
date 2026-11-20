import { Alert, Box, Typography } from '@mui/material';

const StudentResultsTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Academic Results
      </Typography>

      <Alert severity="info">Academic result records are not available yet.</Alert>
    </Box>
  );
};

export default StudentResultsTab;
