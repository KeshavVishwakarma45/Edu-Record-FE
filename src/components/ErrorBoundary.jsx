import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

// The app-wide "Something went wrong" screen. React Router shows it (as the root route's
// errorElement) when any page crashes while rendering, so we need no class component.
export default function ErrorBoundary() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error); // keep the details for the developer console
  }, [error]);

  return (
    <Box role="alert" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
        <Typography variant="h5" component="h1">
          Something went wrong
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 1 }}>
          The page hit an unexpected problem. Reloading usually fixes it. If it keeps happening,
          tell the team what you clicked just before.
        </Typography>
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.reload()}>
          Reload the page
        </Button>
      </Box>
    </Box>
  );
}
