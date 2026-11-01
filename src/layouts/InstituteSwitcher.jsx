import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import InstituteBadge from '@/components/InstituteBadge';

// Lists ONLY the institutes this user can access (the server sends that list).
// Choosing one sets the X-Institute-Id header for every following request.
export default function InstituteSwitcher() {
  const { institutes, selectedInstitute, selectInstitute } = useAuth();
  if (!selectedInstitute) return null;

  return (
    <TextField
      select
      label="Institute"
      value={selectedInstitute.id}
      onChange={(event) => selectInstitute(event.target.value)}
      fullWidth={false}
      sx={{ minWidth: 110 }}
      slotProps={{
        select: { renderValue: () => <InstituteBadge shortCode={selectedInstitute.shortCode} /> },
      }}
    >
      {institutes.map((institute) => (
        <MenuItem key={institute.id} value={institute.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <InstituteBadge shortCode={institute.shortCode} />
            <Typography>{institute.name}</Typography>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
}
