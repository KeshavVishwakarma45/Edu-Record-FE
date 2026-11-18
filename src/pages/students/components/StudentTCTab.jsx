import { Box, Paper, Typography, Chip, Button, Stack, Divider } from '@mui/material';

import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

const mockTC = {
  tcNumber: 'TC/2026/001',
  issueDate: '15/06/2026',
  studentName: 'Rahul Sharma',
  course: 'Bachelor of Computer Applications',
  lastAcademicYear: '2025-2026',
  reason: 'Course completed',
  status: 'Not Generated',
};

const StudentTCTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Transfer Certificate
      </Typography>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between" flexWrap="wrap">
            <Typography fontWeight={600}>TC Details</Typography>

            <Chip label={mockTC.status} color="warning" variant="outlined" />
          </Box>

          <Divider />

          <Box>
            <Typography variant="caption" color="text.secondary">
              Student Name
            </Typography>
            <Typography fontWeight={500}>{mockTC.studentName}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Course
            </Typography>
            <Typography fontWeight={500}>{mockTC.course}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              TC Number
            </Typography>
            <Typography fontWeight={500}>{mockTC.tcNumber}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Issue Date
            </Typography>
            <Typography fontWeight={500}>{mockTC.issueDate}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Last Academic Year
            </Typography>
            <Typography fontWeight={500}>{mockTC.lastAcademicYear}</Typography>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Reason
            </Typography>
            <Typography fontWeight={500}>{mockTC.reason}</Typography>
          </Box>

          <Divider />

          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} disabled>
            Download TC
          </Button>

          <Typography variant="caption" color="text.secondary">
            TC download will be available after actual certificate generation is connected.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default StudentTCTab;
