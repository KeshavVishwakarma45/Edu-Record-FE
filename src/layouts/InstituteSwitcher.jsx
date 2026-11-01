import { Box, MenuItem, TextField, Typography } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import InstituteBadge from '@/components/InstituteBadge';
import { ALL_INSTITUTES } from '@/api/client';

// Lists ONLY the institutes this user can access (the server sends that list).
// Choosing one sets the X-Institute-Id header for every following request.
// The Super Admin also gets "All institutes" (the default): every institute's records together.
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
            <Box>
              <Typography>{institute.name}</Typography>
              {institute.unit && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  {institute.unit.name} · {institute.roleName}
                </Typography>
              )}
              {institute.id === ALL_INSTITUTES && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                  Every institute together
                </Typography>
              )}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </TextField>
  );
}
