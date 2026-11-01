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
  const methods = useForm({ defaultValues: { mobile: '', password: '' } });

  // After login, go back to the page the user originally wanted
  const from = location.state?.from?.pathname || '/';
  if (user) return <Navigate to={from} replace />;

  const onSubmit = methods.handleSubmit(async ({ mobile, password }) => {
    setServerError('');
    try {
      await login(mobile.trim(), password);
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
        placeItems: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 400 }}>
        <Typography variant="h5" component="h1" sx={{ color: 'primary.main' }}>
          EduRecords
        </Typography>
        <Typography sx={{ color: 'text.secondary', mb: 3 }}>
          Sant Singaji Education Society
        </Typography>

        <FormProvider {...methods}>
          <Stack component="form" noValidate spacing={2} onSubmit={onSubmit}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            <FormTextField
              name="mobile"
              label="Mobile number"
              autoComplete="username"
              autoFocus
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
              rules={{
                required: 'Enter your mobile number',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a 10-digit mobile number' },
              }}
            />
            <FormTextField
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              rules={{ required: 'Enter your password' }}
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
              loading={methods.formState.isSubmitting}
            >
              Log in
            </Button>
          </Stack>
        </FormProvider>
      </Paper>
    </Box>
  );
}
