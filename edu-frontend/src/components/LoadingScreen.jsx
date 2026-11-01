import { Box, CircularProgress, Typography } from '@mui/material';

// Full-screen spinner while the app checks whether the user is still logged in.
export default function LoadingScreen() {
  return (
    <Box
      role="status"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ textAlign: 'center' }}>
        <CircularProgress aria-hidden="true" />
        <Typography sx={{ mt: 2, color: 'text.secondary' }}>Loading EduRecords…</Typography>
      </Box>
    </Box>
  );
}
