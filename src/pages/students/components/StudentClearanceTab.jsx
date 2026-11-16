import { useState } from 'react';

import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Grid,
} from '@mui/material';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

const mockClearance = [
  {
    id: 1,
    department: 'Library',
    status: 'CLEAR',
  },
  {
    id: 2,
    department: 'Accounts',
    status: 'PENDING',
  },
  {
    id: 3,
    department: 'Hostel',
    status: 'CLEAR',
  },
  {
    id: 4,
    department: 'Department',
    status: 'CLEAR',
  },
];

const getStatusDetails = (status) => {
  switch (status) {
    case 'CLEAR':
      return {
        label: 'Cleared',
        color: 'success',
      };

    case 'NOT_CLEAR':
      return {
        label: 'Not Clear',
        color: 'error',
      };

    default:
      return {
        label: 'Pending',
        color: 'warning',
      };
  }
};

const StudentClearanceTab = () => {
  const [open, setOpen] = useState(false);

  const clearedCount = mockClearance.filter((item) => item.status === 'CLEAR').length;

  const totalCount = mockClearance.length;

  const allCleared = clearedCount === totalCount;

  const overallStatus = allCleared ? 'Cleared' : 'Pending';

  const handleGenerateTC = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Student Clearance
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Track your department-wise clearance status.
          </Typography>
        </Box>

        <Chip
          label={`Overall Status: ${overallStatus}`}
          color={allCleared ? 'success' : 'warning'}
          variant="outlined"
        />
      </Box>

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Departments Cleared
            </Typography>

            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {clearedCount}/{totalCount}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Completed clearance requests
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 2,
              height: '100%',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Pending Departments
            </Typography>

            <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
              {totalCount - clearedCount}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Awaiting department clearance
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Department Status */}
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Department-wise Status
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Clearance updates from all required departments.
          </Typography>
        </Box>

        <Divider />

        <Stack spacing={0} divider={<Divider />}>
          {mockClearance.map((item) => {
            const status = getStatusDetails(item.status);

            return (
              <Box
                key={item.id}
                sx={{
                  px: 2.5,
                  py: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography fontWeight={600}>{item.department}</Typography>

                  <Typography variant="caption" color="text.secondary">
                    Department clearance
                  </Typography>
                </Box>

                <Chip
                  icon={status.icon}
                  label={status.label}
                  color={status.color}
                  variant="outlined"
                  size="small"
                />
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* TC Action */}
      <Paper
        variant="outlined"
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: 2,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography fontWeight={700}>Transfer Certificate</Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {allCleared
                ? 'All department clearances are complete.'
                : 'Complete all mandatory department clearances to become eligible for TC generation.'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<DescriptionOutlinedIcon />}
            disabled={!allCleared}
            onClick={handleGenerateTC}
          >
            Generate TC
          </Button>
        </Box>
      </Paper>

      {/* TC Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Transfer Certificate</DialogTitle>

        <DialogContent>
          <Typography>
            Your department clearances are complete. Transfer Certificate generation will be
            available after backend integration.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Mock Data Notice */}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
        Note: The displayed department statuses are sample data. Live status updates will be
        available after backend API integration.
      </Typography>
    </Box>
  );
};

export default StudentClearanceTab;
