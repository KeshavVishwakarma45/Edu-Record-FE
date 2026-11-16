import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Tabs,
  Tab,
} from '@mui/material';

import DepartmentQueue from './DepartmentQueue';
import AccountsDues from './AccountsDues';

const initialForm = {
  studentId: '',
  lastClassAttended: '',
  leavingReason: '',
  documentsEnclosed: {
    tenthMarksheet: false,
    twelfthMarksheet: false,
    yearMarksheets: false,
    semesterMarksheets: false,
  },
  declarations: {
    feesPaid: false,
    duesCleared: false,
    booksReturned: false,
  },
};

const documentOptions = [
  ['tenthMarksheet', '10th Marksheet'],
  ['twelfthMarksheet', '12th Marksheet'],
  ['yearMarksheets', 'Year-wise Marksheets'],
  ['semesterMarksheets', 'Semester-wise Marksheets'],
];

const declarationOptions = [
  ['feesPaid', 'All applicable fees have been paid.'],
  ['duesCleared', 'All outstanding dues have been cleared.'],
  ['booksReturned', 'All issued library books have been returned.'],
];

export default function ClearancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (section, field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: event.target.checked,
      },
    }));
  };

  const handleReset = () => {
    setForm(initialForm);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // API integration pending backend schema confirmation.
  };

  const sectionStyle = {
    p: { xs: 2, md: 3 },
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    boxShadow: 'none',
  };

  const sectionHeading = {
    fontWeight: 700,
    fontSize: '1rem',
    mb: 2.5,
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Clearance & Transfer Certificate
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage TC applications and department-wise clearance.
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="TC Application" />
          <Tab label="Department Queue" />
          <Tab label="Accounts Dues" />
        </Tabs>
      </Paper>

      {/* TC Application */}
      {activeTab === 0 && (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          {/* Student Information */}
          <Paper sx={sectionStyle}>
            <Typography sx={sectionHeading}>Student Information</Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1fr 1fr',
                },
                gap: 2.5,
              }}
            >
              <TextField
                fullWidth
                required
                label="Student ID"
                name="studentId"
                value={form.studentId}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                required
                label="Last Class Attended"
                name="lastClassAttended"
                value={form.lastClassAttended}
                onChange={handleChange}
              />

              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  required
                  multiline
                  minRows={3}
                  label="Reason for Leaving"
                  name="leavingReason"
                  value={form.leavingReason}
                  onChange={handleChange}
                />
              </Box>
            </Box>
          </Paper>

          {/* Documents Enclosed */}
          <Paper sx={sectionStyle}>
            <Typography sx={sectionHeading}>Documents Enclosed</Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                },
                columnGap: 3,
                rowGap: 1,
              }}
            >
              {documentOptions.map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  sx={{ m: 0, minHeight: 40 }}
                  control={
                    <Checkbox
                      checked={form.documentsEnclosed[key]}
                      onChange={handleCheckboxChange('documentsEnclosed', key)}
                    />
                  }
                  label={label}
                />
              ))}
            </Box>
          </Paper>

          {/* Student Declarations */}
          <Paper sx={sectionStyle}>
            <Typography sx={sectionHeading}>Student Declarations</Typography>

            <Stack spacing={1.5}>
              {declarationOptions.map(([key, label]) => (
                <FormControlLabel
                  key={key}
                  sx={{ m: 0 }}
                  control={
                    <Checkbox
                      checked={form.declarations[key]}
                      onChange={handleCheckboxChange('declarations', key)}
                    />
                  }
                  label={label}
                />
              ))}
            </Stack>
          </Paper>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pb: 2 }}>
            <Button variant="outlined" onClick={handleReset}>
              Reset
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                !form.studentId.trim() ||
                !form.lastClassAttended.trim() ||
                !form.leavingReason.trim()
              }
            >
              Submit Application
            </Button>
          </Stack>
        </Box>
      )}

      {/* Department Queue */}
      {activeTab === 1 && <DepartmentQueue />}

      {/* Accounts Dues */}
      {activeTab === 2 && <AccountsDues />}
    </Box>
  );
}
