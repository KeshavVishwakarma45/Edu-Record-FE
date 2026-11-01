import { Box, Typography } from '@mui/material';
import InstituteBadge from './InstituteBadge';

// Institute badges in a table cell, with an optional caption above (e.g. the unit name):
//   <InstituteBadges caption="Sant Singaji Education Society" shortCodes={['SSISM', 'SSEC']} />
export default function InstituteBadges({ caption, shortCodes = [] }) {
  return (
    <Box>
      {caption && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 0.5 }}>
          {caption}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {shortCodes.length > 0 ? (
          shortCodes.map((code) => <InstituteBadge key={code} shortCode={code} />)
        ) : (
          <Typography component="span">—</Typography>
        )}
      </Box>
    </Box>
  );
}
