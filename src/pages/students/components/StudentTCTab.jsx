import { Alert, Box, Typography } from '@mui/material';

const StudentTCTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Transfer Certificate
      </Typography>

      <Alert severity="info">
        No Transfer Certificate record is available for this student yet.
      </Alert>
    </Box>
  );
};

export default StudentTCTab;
