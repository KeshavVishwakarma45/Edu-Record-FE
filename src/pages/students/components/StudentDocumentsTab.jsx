import { Alert, Box, Typography } from '@mui/material';

const StudentDocumentsTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Student Documents
      </Typography>

      <Alert severity="info">Student document records are not available yet.</Alert>
    </Box>
  );
};

export default StudentDocumentsTab;
