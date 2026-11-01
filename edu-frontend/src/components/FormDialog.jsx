import { FormProvider, useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNotify } from '@/hooks/useNotify';

// Every create / edit form opens in this dialog.
//
//   <FormDialog open={!!editing} title="Edit course" defaultValues={...}
//               onSubmit={handleSave} onClose={() => setEditing(null)}>
//     <FormTextField name="name" label="Name" rules={{ required: 'Enter the name' }} />
//   </FormDialog>
//
// - The Form* fields inside find the form on their own (no need to pass `control`).
// - onSubmit(values) must return a promise. Close the dialog yourself when it succeeds.
//   If it throws an API error, the dialog stays open, server field errors appear under
//   the matching fields (error.details), and the message is shown as a toast.
export default function FormDialog({ open, onClose, ...props }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  // The dialog only renders its content while open, so the form below starts fresh
  // with the latest defaultValues every time the dialog opens.
  return (
    <Dialog
      open={open}
      onClose={props.loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isPhone}
    >
      <FormDialogContent onClose={onClose} {...props} />
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
}) {
  const methods = useForm({ defaultValues });
  const { handleSubmit, setError, formState } = methods;
  const notify = useNotify();
  const busy = loading || formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      // Server says which fields are wrong: show each message under its field
      (error?.details ?? []).forEach(({ field, message }) => {
        const name = field.split('.')[0];
        if (name in values) setError(name, { type: 'server', message });
      });
      notify.error(error);
    }
  });

  return (
    <FormProvider {...methods}>
      <Box component="form" noValidate onSubmit={submit} sx={{ display: 'contents' }}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {children}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={busy}>
            {submitLabel}
          </Button>
        </DialogActions>
      </Box>
    </FormProvider>
  );
}
