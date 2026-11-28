import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';

import { useNotify } from '@/hooks/useNotify';

// Reusable dialog for create and edit forms.
export default function FormDialog({
  open,
  onClose,
  maxWidth = 'sm',
  contentSpacing = 2,
  contentSx = {},
  ...props
}) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      fullWidth
      maxWidth={maxWidth}
      fullScreen={isPhone}
    >
      <FormDialogContent
        onClose={onClose}
        contentSpacing={contentSpacing}
        contentSx={contentSx}
        {...props}
      />
    </Dialog>
  );
}

function FormDialogContent({
  title,
  onClose,
  onSubmit,
  defaultValues,
  children,
  submitLabel = 'Save',
  loading = false,
  contentSpacing,
  contentSx,
}) {
  const methods = useForm({ defaultValues });

  const { handleSubmit, setError, reset, getValues, formState } = methods;

  const notify = useNotify();

  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const busy = loading || formState.isSubmitting;

  const hasValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return true;
  };

  // Confirmation is required when at least 50% of the fields are filled.
  const hasHalfFilledForm = () => {
    const values = getValues();

    const fields = Object.keys(defaultValues ?? {}).filter((key) => key !== 'instituteId');

    if (fields.length === 0) return false;

    const filledFields = fields.filter((key) => hasValue(values[key])).length;

    return (filledFields / fields.length) * 100 >= 50;
  };

  const handleCancel = () => {
    if (busy) return;

    if (hasHalfFilledForm()) {
      setConfirmDiscard(true);
      return;
    }

    reset(defaultValues);
    onClose?.();
  };

  const handleDiscard = () => {
    reset(defaultValues);
    setConfirmDiscard(false);
    onClose?.();
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      (error?.details ?? []).forEach(({ field, message }) => {
        const name = field.split('.')[0];

        if (name in values) {
          setError(name, {
            type: 'server',
            message,
          });
        }
      });

      notify.error(error);
    }
  });

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        noValidate
        autoComplete="off"
        onSubmit={submit}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            pr: 1.5,
            fontWeight: 700,
          }}
        >
          <Typography component="span" variant="h6" fontWeight={700}>
            {title}
          </Typography>

          <IconButton aria-label="Close form" onClick={handleCancel} disabled={busy} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            position: 'relative',
          }}
        >
          <Stack
            spacing={contentSpacing}
            sx={{
              pt: 1,
              ...contentSx,
            }}
          >
            {children}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCancel} disabled={busy}>
            Cancel
          </Button>

          <Button type="submit" variant="contained" disabled={busy}>
            {submitLabel}
          </Button>
        </DialogActions>

        {/* Full-form loading overlay */}
        {busy && (
          <Box
            role="status"
            aria-live="polite"
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              bgcolor: 'rgba(255, 255, 255, 0.78)',
              backdropFilter: 'blur(2px)',
            }}
          >
            <CircularProgress size={42} />

            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Saving student, please wait...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Discard confirmation */}
      <Dialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Discard entered data?</DialogTitle>

        <DialogContent>
          <Typography color="text.secondary">
            You have filled at least 50% of the form. If you cancel now, all entered data will be
            cleared. Are you sure you want to discard this form?
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmDiscard(false)}>Keep Editing</Button>

          <Button color="error" variant="contained" onClick={handleDiscard}>
            Yes, Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </FormProvider>
  );
}
