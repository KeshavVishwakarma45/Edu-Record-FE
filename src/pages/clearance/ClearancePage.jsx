import { useState, useEffect, useCallback } from 'react';

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
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';

import DepartmentQueue from './DepartmentQueue';
import AccountsDues from './AccountsDues';
import { clearanceApi } from '../../api/clearance';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '../../constants/permissions';

// Initial TC Application Form
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

// Status Chip Styling - Based on UI Design PDF
const getStatusChipSx = (status) => {
  const normalizedStatus = status?.toUpperCase();

  const statusStyles = {
    CLEAR: {
      backgroundColor: '#DDF2FC',
      color: '#176B91',
      borderColor: '#B8E2F4',
    },

    NOT_CLEAR: {
      backgroundColor: '#FCE9DF',
      color: '#A64B2A',
      borderColor: '#F1C7B3',
    },

    PENDING: {
      backgroundColor: '#FFFFFF',
      color: '#596273',
      borderColor: '#D9DDE4',
    },
  };

  return {
    fontWeight: 600,
    borderRadius: '999px',
    border: '1px solid',
    height: 26,
    flexShrink: 0,
    ...(statusStyles[normalizedStatus] || statusStyles.PENDING),
    '& .MuiChip-label': {
      px: 1.25,
    },
  };
};

export default function ClearancePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(false);
  const [queueLoading, setQueueLoading] = useState(false);
  const [duesLoading, setDuesLoading] = useState(false);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [applications, setApplications] = useState([]);
  const [queueItems, setQueueItems] = useState([]);
  const [duesItems, setDuesItems] = useState([]);

  const [message, setMessage] = useState(null);

  const { can, isSuperAdmin } = useAuth();

  const canApplyTC = can(PERMISSIONS.TC_APPLY);
  const canViewClearance = can(PERMISSIONS.CLEARANCE_VIEW);
  const canActClearance = can(PERMISSIONS.CLEARANCE_ACT);

  // Fetch TC Applications
  const fetchApplications = useCallback(async () => {
    if (!canViewClearance) return;

    try {
      setApplicationsLoading(true);

      const response = await clearanceApi.listApplications();

      setApplications(Array.isArray(response?.rows) ? response.rows : []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to load TC applications.',
      });
    } finally {
      setApplicationsLoading(false);
    }
  }, [canViewClearance]);

  // Fetch Department Queue
  const fetchDepartmentQueue = useCallback(async () => {
    if (!canViewClearance) return;

    try {
      setQueueLoading(true);

      // Super Admin: Fetch all applications for read-only view
      if (isSuperAdmin) {
        const response = await clearanceApi.listApplications();

        const applicationRows = Array.isArray(response?.rows) ? response.rows : [];

        const departmentRows = applicationRows.flatMap((application) =>
          (application.departmentWiseStatus || []).map((department, index) => ({
            _id:
              department.clearanceItemId ||
              department.itemId ||
              department._id ||
              `${application._id}-${department.departmentId || index}`,

            studentId: application.student?._id || application.studentId,
            studentName: application.student?.name || 'Student',
            departmentName: department.departmentName || 'Department',
            status: department.status || 'PENDING',
            remark: department.remark || '',
            amountDue: department.amountDue || 0,
          })),
        );

        setQueueItems(departmentRows);
        return;
      }

      // Other users: Existing Department Queue API
      const response = await clearanceApi.getQueue();

      setQueueItems(Array.isArray(response?.rows) ? response.rows : []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to load department queue.',
      });
    } finally {
      setQueueLoading(false);
    }
  }, [canViewClearance, isSuperAdmin]);

  // Fetch Pending Dues
  const fetchPendingDues = useCallback(async () => {
    if (!canViewClearance) return;

    try {
      setDuesLoading(true);

      const response = await clearanceApi.getPendingDues();

      setDuesItems(Array.isArray(response?.rows) ? response.rows : []);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to load pending dues.',
      });
    } finally {
      setDuesLoading(false);
    }
  }, [canViewClearance]);

  // Fetch data according to selected tab
  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(() => {
      if (!isActive) return;

      if (activeTab === 0 && canViewClearance) {
        fetchApplications();
      } else if (activeTab === 1 && canViewClearance) {
        fetchDepartmentQueue();
      } else if (activeTab === 2 && canViewClearance) {
        fetchPendingDues();
      }
    });

    return () => {
      isActive = false;
    };
  }, [activeTab, canViewClearance, fetchApplications, fetchDepartmentQueue, fetchPendingDues]);

  // Fetch data according to selected tab
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 0 && canViewClearance) {
        fetchApplications();
      } else if (activeTab === 1 && canViewClearance) {
        fetchDepartmentQueue();
      } else if (activeTab === 2 && canViewClearance) {
        fetchPendingDues();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, canViewClearance, fetchApplications, fetchDepartmentQueue, fetchPendingDues]);

  // Department Status Update
  const handleDepartmentStatusChange = async (item, status) => {
    try {
      await clearanceApi.updateItem(item._id, { status });

      setMessage({
        type: 'success',
        text: `Clearance marked as ${status}.`,
      });

      await fetchDepartmentQueue();
      await fetchApplications();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to update clearance status.',
      });
    }
  };

  // Accounts Dues Update
  const handleUpdateDues = async (item, values) => {
    const amountDue = Number(values.amountDue);

    if (!Number.isFinite(amountDue) || amountDue < 0) {
      setMessage({
        type: 'error',
        text: 'Please enter a valid dues amount.',
      });
      return;
    }

    try {
      await clearanceApi.updateDues(item._id, {
        amountDue,
        remark: values.remark,
      });

      setMessage({
        type: 'success',
        text: 'Student dues updated successfully.',
      });

      await fetchPendingDues();
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.message || 'Unable to update student dues.',
      });
    }
  };

  // Form Input Change
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Checkbox Change
  const handleCheckboxChange = (section, field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: event.target.checked,
      },
    }));
  };

  // Reset Form
  const handleReset = () => {
    setForm({
      ...initialForm,
      documentsEnclosed: { ...initialForm.documentsEnclosed },
      declarations: { ...initialForm.declarations },
    });
  };

  // Submit TC Application
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage(null);

    const payload = {
      studentId: form.studentId.trim(),
      lastClassAttended: form.lastClassAttended.trim(),
      leavingReason: form.leavingReason.trim(),

      documentsEnclosed: {
        tenthMarksheet: form.documentsEnclosed.tenthMarksheet,
        twelfthMarksheet: form.documentsEnclosed.twelfthMarksheet,
        yearSemesterMarksheets:
          form.documentsEnclosed.yearMarksheets || form.documentsEnclosed.semesterMarksheets,
      },

      declarations: {
        feesPaid: form.declarations.feesPaid,
        duesCleared: form.declarations.duesCleared,
        booksReturned: form.declarations.booksReturned,
      },
    };

    try {
      setLoading(true);

      await clearanceApi.createApplication(payload);

      setMessage({
        type: 'success',
        text: 'TC application submitted successfully.',
      });

      handleReset();

      if (canViewClearance) {
        await fetchApplications();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error?.message ||
          error?.response?.data?.error?.message ||
          'Unable to submit the application. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Common Section Styling
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

      {/* Tabs */}
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

      {/* Feedback Message */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* TC Application Form */}
      {activeTab === 0 && canApplyTC && !isSuperAdmin && (
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
                helperText="Enter the student's MongoDB record ID."
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
                      id={`document-${key}`}
                      name={`document-${key}`}
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
                      id={`declaration-${key}`}
                      name={`declaration-${key}`}
                      checked={form.declarations[key]}
                      onChange={handleCheckboxChange('declarations', key)}
                    />
                  }
                  label={label}
                />
              ))}
            </Stack>
          </Paper>

          {/* Form Actions */}
          <Stack
            direction="row"
            spacing={2}
            sx={{
              pb: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="outlined" onClick={handleReset} disabled={loading}>
              Reset
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                !form.studentId.trim() ||
                !form.lastClassAttended.trim() ||
                !form.leavingReason.trim()
              }
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Submit Application'}
            </Button>
          </Stack>
        </Box>
      )}

      {/* Submitted TC Applications */}
      {activeTab === 0 && canViewClearance && (
        <Paper sx={{ ...sectionStyle, mt: canApplyTC && !isSuperAdmin ? 3 : 0 }}>
          {/* Applications Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              mb: 2.5,
              gap: 2,
            }}
          >
            <Typography fontWeight={700} fontSize="1rem" sx={{ lineHeight: 1.5 }}>
              Submitted TC Applications
            </Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={fetchApplications}
              disabled={applicationsLoading}
              sx={{
                flexShrink: 0,
                minWidth: 'auto',
                alignSelf: 'center',
              }}
            >
              Refresh
            </Button>
          </Box>

          {/* Loading */}
          {applicationsLoading ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: 4,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          ) : applications.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{
                py: 3,
                textAlign: 'center',
              }}
            >
              No TC applications found.
            </Typography>
          ) : (
            /* Applications List */
            <Stack spacing={2}>
              {applications.map((application) => (
                <Paper
                  key={application._id}
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                  }}
                >
                  {/* Student Details */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      width: '100%',
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} fontSize="1rem">
                        {application.student?.name || 'Student'}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Scholar No: {application.student?.scholarNo || '—'}
                        {'  |  '}
                        Roll No: {application.student?.rollNo || '—'}
                      </Typography>
                    </Box>

                    <Chip
                      label={application.overallStatus?.replace('_', ' ') || 'PENDING'}
                      size="small"
                      sx={{
                        ...getStatusChipSx(application.overallStatus),
                        ml: 'auto',
                      }}
                    />
                  </Stack>

                  {/* Department Status */}
                  {Array.isArray(application.departmentWiseStatus) &&
                    application.departmentWiseStatus.length > 0 && (
                      <Box sx={{ mt: 2.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                          Department Clearance Status
                        </Typography>

                        <Stack spacing={1}>
                          {application.departmentWiseStatus.map((department, index) => (
                            <Stack
                              key={department.departmentId || department._id || index}
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              spacing={2}
                              sx={{
                                py: 1,
                                px: 1.5,
                                borderRadius: 1.5,
                                bgcolor: 'action.hover',
                                width: '100%',
                              }}
                            >
                              <Typography
                                sx={{
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                {department.departmentName}
                              </Typography>

                              <Chip
                                label={department.status?.replace('_', ' ') || 'PENDING'}
                                size="small"
                                sx={getStatusChipSx(department.status)}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      </Box>
                    )}
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      )}

      {/* Department Queue */}
      {activeTab === 1 && (
        <DepartmentQueue
          items={queueItems}
          loading={queueLoading}
          onStatusChange={
            !isSuperAdmin && canViewClearance && canActClearance
              ? handleDepartmentStatusChange
              : undefined
          }
        />
      )}

      {/* Accounts Dues */}
      {activeTab === 2 && (
        <AccountsDues
          items={duesItems}
          loading={duesLoading}
          onUpdateDues={
            !isSuperAdmin && canViewClearance && canActClearance ? handleUpdateDues : undefined
          }
        />
      )}
    </Box>
  );
}
