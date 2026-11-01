import { Chip } from '@mui/material';
import { instituteColor } from '@/theme';

// The coloured institute short code (pink SSISM, blue-grey SSEC), so it is always clear
// which institute's data is on screen.
export default function InstituteBadge({ shortCode }) {
  const color = instituteColor(shortCode);
  return (
    <Chip
      label={shortCode}
      size="small"
      sx={{
        bgcolor: color.background,
        color: color.text,
        fontWeight: 700,
        cursor: 'inherit',
        transition: 'none', // change colour instantly when the institute is switched
      }}
    />
  );
}
