import { useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { getErrorMessage } from '@/utils/format';

// Small toast messages at the bottom of the screen. Never use alert().
//   const notify = useNotify();
//   notify.success('Course added');
//   notify.error(error);          // an API error object or a text
export function useNotify() {
  const { enqueueSnackbar } = useSnackbar();
  return useMemo(
    () => ({
      success: (message) => enqueueSnackbar(message, { variant: 'success' }),
      info: (message) => enqueueSnackbar(message, { variant: 'info' }),
      error: (error) => enqueueSnackbar(getErrorMessage(error), { variant: 'error' }),
    }),
    [enqueueSnackbar],
  );
}
