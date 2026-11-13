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
} from '@mui/material';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

const mockClearance = [
  {
    id: 1,
    department: 'Library',
    status: 'Cleared',
  },
  {
    id: 2,
    department: 'Accounts',
    status: 'Pending',
  },
  {
    id: 3,
    department: 'Hostel',
    status: 'Cleared',
  },
  {
    id: 4,
    department: 'Department',
    status: 'Cleared',
  },
];

const StudentClearanceTab = () => {
  const [open, setOpen] = useState(false);

  const handleGenerateTC = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" fontWeight={600}>
          Student Clearance
        </Typography>

        <Button
          variant="contained"
          startIcon={<DescriptionOutlinedIcon />}
          onClick={handleGenerateTC}
        >
          Generate TC
        </Button>
      </Box>

      <Stack spacing={2}>
        {mockClearance.map((item) => (
          <Paper key={item.id} variant="outlined" sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
              <Typography fontWeight={500}>{item.department}</Typography>

              <Chip
                label={item.status}
                color={item.status === 'Cleared' ? 'success' : 'warning'}
                variant="outlined"
              />
            </Box>
          </Paper>
        ))}
      </Stack>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Generate Transfer Certificate</DialogTitle>

        <DialogContent>
          <Typography>
            Transfer Certificate generation will be connected to the TC module in the next
            integration phase.
          </Typography>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>

          <Button variant="contained" onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentClearanceTab;
