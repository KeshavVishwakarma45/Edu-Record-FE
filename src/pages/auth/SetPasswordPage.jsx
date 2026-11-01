import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import FormTextField from '@/components/form/FormTextField';
import LoadingScreen from '@/components/LoadingScreen';
import { authApi } from '@/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/format';

// Opened from an invite or password-reset link (/set-password/<token>). No login needed:
// the link itself proves who the person is. It works once and expires after 7 days.
export default function SetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { acceptSession } = useAuth();
  const [link, setLink] = useState({ loading: true, info: null, error: null });
  const [serverError, setServerError] = useState('');
  const methods = useForm({ defaultValues: { password: '', confirm: '' } });

  useEffect(() => {
    authApi
      .checkSetupLink(token)
      .then((info) => setLink({ loading: false, info, error: null }))
      .catch((error) => setLink({ loading: false, info: null, error }));
  }, [token]);

  const onSubmit = methods.handleSubmit(async ({ password }) => {
    setServerError('');
    try {
      const session = await authApi.useSetupLink(token, password);
      acceptSession(session);
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  if (link.loading) return <LoadingScreen />;

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
      <Paper sx={{ p: { xs: 3, sm: 4 }, width: '100%', maxWidth: 420 }}>
        <Typography variant="h5" component="h1" sx={{ color: 'primary.main' }}>
          EduRecords
        </Typography>
        {link.error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {getErrorMessage(link.error)}
          </Alert>
        ) : (
          <>
            <Typography sx={{ color: 'text.secondary', mb: 3 }}>
              {link.info.isNewUser ? 'Welcome' : 'Reset your password'}, {link.info.name}. Choose a
              password for {link.info.email}.
            </Typography>
            <FormProvider {...methods}>
              <Stack component="form" noValidate spacing={2} onSubmit={onSubmit}>
                {serverError && <Alert severity="error">{serverError}</Alert>}
                <FormTextField
                  name="password"
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  autoFocus
                  helperText="At least 8 characters"
                  rules={{
                    required: 'Choose a password',
                    minLength: { value: 8, message: 'Use at least 8 characters' },
                  }}
                />
                <FormTextField
                  name="confirm"
                  label="Type it again"
                  type="password"
                  autoComplete="new-password"
                  rules={{
                    required: 'Type the password again',
                    validate: (value, values) =>
                      value === values.password || 'The passwords differ',
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={methods.formState.isSubmitting}
                >
                  Set password and log in
                </Button>
              </Stack>
            </FormProvider>
          </>
        )}
      </Paper>
    </Box>
  );
}
