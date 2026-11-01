import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { SnackbarProvider } from 'notistack';
import 'dayjs/locale/en-gb'; // dd/mm/yyyy in date pickers
import { theme } from '@/theme';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={4000}
          // Top of the screen, so toasts never cover a dialog's Save button on phones
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <App />
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  </StrictMode>,
);
