import { Box, Paper, Typography, Chip } from '@mui/material';

const mockResults = [
  {
    id: 1,
    examination: 'Semester 1',
    year: '2026',
    percentage: '78%',
    result: 'Pass',
  },
  {
    id: 2,
    examination: 'Semester 2',
    year: '2027',
    percentage: '82%',
    result: 'Pass',
  },
];

const StudentResultsTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Academic Results
      </Typography>

      {mockResults.map((item) => (
        <Paper key={item.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={2}
          >
            <Box>
              <Typography fontWeight={600}>{item.examination}</Typography>

              <Typography variant="body2" color="text.secondary">
                Academic Year: {item.year}
              </Typography>

              <Typography variant="body2" sx={{ mt: 1 }}>
                Percentage: {item.percentage}
              </Typography>
            </Box>

            <Chip label={item.result} color="success" variant="outlined" />
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default StudentResultsTab;
