import { createTheme } from '@mui/material/styles';

// A calm, neutral theme for office staff: 14px text, clear contrast, 8px corners, compact tables.
export const theme = createTheme({
  palette: {
    primary: { main: '#1e4f8a' },
    secondary: { main: '#5b6470' },
    background: { default: '#f4f5f7', paper: '#ffffff' },
    text: { primary: '#1d2327', secondary: '#4f5861' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontSize: 14,
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif',
    body1: { fontSize: '0.875rem' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: { defaultProps: { elevation: 0, color: 'inherit' } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiPaper: { defaultProps: { variant: 'outlined' } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    MuiTable: { defaultProps: { size: 'small' } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 600, whiteSpace: 'nowrap' } } },
  },
});

// Institute colours are used ONLY for the institute badge in the top bar, so it is always
// obvious which institute's data is on screen. They match the paper TC books.
export const INSTITUTE_COLORS = {
  SSISM: { background: '#c2185b', text: '#ffffff' }, // pink TC book
  SSEC: { background: '#546e7a', text: '#ffffff' }, // white TC book, shown as blue-grey
};
const FALLBACK_COLOR = { background: '#616161', text: '#ffffff' };

export function instituteColor(shortCode) {
  return INSTITUTE_COLORS[shortCode] ?? FALLBACK_COLOR;
}
