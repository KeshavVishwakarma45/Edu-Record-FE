import { Box, Paper, Typography, Chip, Stack, Divider } from '@mui/material';

import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

const mockHistory = [
  {
    id: 1,
    title: 'Student Admission',
    description: 'Student admission completed successfully.',
    date: '10/07/2026',
    category: 'Admission',
  },
  {
    id: 2,
    title: 'Documents Submitted',
    description: '10th and 12th marksheets submitted.',
    date: '12/07/2026',
    category: 'Documents',
  },
  {
    id: 3,
    title: 'Course Assigned',
    description: 'Bachelor of Computer Applications assigned.',
    date: '15/07/2026',
    category: 'Academic',
  },
  {
    id: 4,
    title: 'Semester 1 Result',
    description: 'Semester 1 result recorded: 78%.',
    date: '15/06/2027',
    category: 'Results',
  },
];

const StudentHistoryTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Student History
      </Typography>

      <Stack spacing={2}>
        {mockHistory.map((item, index) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" gap={2}>
              <HistoryOutlinedIcon color="action" />

              <Box flex={1}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Typography fontWeight={600}>{item.title}</Typography>

                  <Chip label={item.category} size="small" variant="outlined" />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {item.description}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  Date: {item.date}
                </Typography>
              </Box>
            </Box>

            {index !== mockHistory.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

export default StudentHistoryTab;
