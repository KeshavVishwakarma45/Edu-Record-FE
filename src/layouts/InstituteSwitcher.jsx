import { Box, MenuItem, Select, Typography } from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useAuth } from '@/hooks/useAuth';
import InstituteBadge from '@/components/InstituteBadge';
import { ALL_INSTITUTES } from '@/api/client';

// Shows the selected institute and only the institutes the signed-in user can access.
// Changing this value updates AuthContext and the X-Institute-Id used by API requests.
export default function InstituteSwitcher() {
  const { institutes, selectedInstitute, selectInstitute } = useAuth();

  if (!selectedInstitute) return null;

  return (
    <Select
      value={selectedInstitute.id}
      onChange={(event) => selectInstitute(event.target.value)}
      displayEmpty
      fullWidth
      IconComponent={ExpandMoreRoundedIcon}
      inputProps={{ 'aria-label': 'Select institute' }}
      renderValue={() => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
          <InstituteBadge shortCode={selectedInstitute.shortCode} />
          <Typography
            sx={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: { xs: 12, sm: 13, md: 14 },
              fontWeight: 600,
              color: 'text.primary',
            }}
          >
            {selectedInstitute.name}
          </Typography>
        </Box>
      )}
      sx={{
        height: 44,
        borderRadius: 3,
        bgcolor: 'background.paper',
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          py: 0.5,
          pl: 1.25,
          pr: '34px !important',
        },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider', borderWidth: 1.5 },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' },
      }}
    >
      {institutes.map((institute) => (
        <MenuItem key={institute.id} value={institute.id}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <InstituteBadge shortCode={institute.shortCode} />
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap>{institute.name}</Typography>
              {institute.unit && (
                <Typography color="text.secondary" variant="caption" noWrap>
                  {institute.unit.name} · {institute.roleName}
                </Typography>
              )}
              {institute.id === ALL_INSTITUTES && (
                <Typography color="text.secondary" variant="caption">
                  Every institute together
                </Typography>
              )}
            </Box>
          </Box>
        </MenuItem>
      ))}
    </Select>
  );
}
