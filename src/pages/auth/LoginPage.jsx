import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import FormTextField from '@/components/form/FormTextField';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/format';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const methods = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const from = location.state?.from?.pathname || '/';

  if (user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = methods.handleSubmit(async ({ email, password }) => {
    setServerError('');

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '0.97fr 1.03fr' },
        bgcolor: '#fffaf4',
      }}
    >
      {/* Left branding panel */}
      <Box
        sx={{
          bgcolor: '#eef0ff',
          px: { xs: 3, sm: 6, lg: 10 },
          py: { xs: 4, md: 5 },
          minHeight: { xs: 380, md: '100vh' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              bgcolor: '#2448bd',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontSize: 22,
              fontWeight: 800,
            }}
          >
            E
          </Box>

          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 750,
              color: '#111827',
            }}
          >
            EduRecords
          </Typography>
        </Stack>

        <Box sx={{ maxWidth: 540, my: { xs: 5, md: 0 } }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: 34, sm: 42, lg: 44 },
              lineHeight: 1.13,
              fontWeight: 800,
              letterSpacing: -1.2,
              color: '#2448bd',
              mb: 2.5,
            }}
          >
            Marksheets, degrees
            <br />
            and TCs in one place.
          </Typography>

          <Typography
            sx={{
              fontSize: 18,
              lineHeight: 1.65,
              color: '#515b6d',
              maxWidth: 510,
              mb: 3.5,
            }}
          >
            Track every document from the university packet to the student’s hands, and issue
            transfer certificates without the paper book.
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Box
              sx={{
                bgcolor: '#fff0e5',
                color: '#111827',
                borderRadius: 5,
                px: 2,
                py: 0.75,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              SSISM
            </Box>

            <Box
              sx={{
                bgcolor: '#e1e8ff',
                color: '#2448bd',
                borderRadius: 5,
                px: 2,
                py: 0.75,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              SSEC
            </Box>
          </Stack>
        </Box>

        <Typography
          sx={{
            color: '#515b6d',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Sant Singaji Education Society, Sandalpur
        </Typography>
      </Box>

      {/* Right login panel */}
      <Box
        sx={{
          minHeight: { xs: 560, md: '100vh' },
          display: 'grid',
          placeItems: 'center',
          px: 2.5,
          py: 5,
          bgcolor: '#fffaf4',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 436,
            p: { xs: 3, sm: 4.5 },
            border: '1px solid #e2e5eb',
            borderRadius: 3,
            bgcolor: '#fff',
          }}
        >
          <Typography
            component="h2"
            sx={{
              fontSize: 28,
              fontWeight: 800,
              color: '#111827',
              mb: 0.75,
            }}
          >
            Sign in
          </Typography>

          <Typography
            sx={{
              fontSize: 15.5,
              lineHeight: 1.35,
              color: '#515b6d',
              mb: 3,
            }}
          >
            Use the email address registered with your institute.
          </Typography>

          <FormProvider {...methods}>
            <Stack component="form" noValidate spacing={2.5} onSubmit={onSubmit}>
              {serverError && <Alert severity="error">{serverError}</Alert>}

              <FormTextField
                name="email"
                label="Email address"
                type="email"
                autoComplete="username"
                autoFocus
                rules={{
                  required: 'Enter your email',
                  pattern: {
                    value: /^\S+@\S+\.\S+$/,
                    message: 'Enter a valid email address',
                  },
                }}
              />

              <FormTextField
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                rules={{
                  required: 'Enter your password',
                }}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword((shown) => !shown)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                loading={methods.formState.isSubmitting}
                sx={{
                  mt: 0.5,
                  py: 1.5,
                  borderRadius: 5,
                  bgcolor: '#2862ed',
                  fontSize: 16,
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#1e50d0',
                  },
                }}
              >
                Sign in
              </Button>
            </Stack>
          </FormProvider>

          <Typography
            sx={{
              mt: 3,
              fontSize: 14,
              lineHeight: 1.55,
              color: '#515b6d',
            }}
          >
            Forgot your password? Ask your Society Admin to reset it.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
