import { useEffect, useState } from 'react';

import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Stack,
  Divider,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';

import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';

import { clearanceApi } from '@/api/clearance';
import { useRequest } from '@/hooks/useRequest';

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

const StudentClearanceTab = ({ studentId }) => {
  const [clearance, setClearance] = useState(null);

  const { run: getClearance, loading, error } = useRequest(clearanceApi.getStudentClearance);

  useEffect(() => {
    let isActive = true;

    const timer = setTimeout(() => {
      setClearance(null);

      if (!studentId) return;

      getClearance(studentId)
        .then((data) => {
          if (isActive) {
            setClearance(data);
          }
        })
        .catch(() => {
          if (isActive) {
            setClearance(null);
          }
        });
    }, 0);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [studentId, getClearance]);

  const handleRetry = () => {
    getClearance(studentId)
      .then(setClearance)
      .catch(() => setClearance(null));
  };

  if (loading && !clearance) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !clearance) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<RefreshOutlinedIcon />}
            onClick={handleRetry}
          >
            Retry
          </Button>
        }
      >
        {error.message || 'Unable to load student clearance details.'}
      </Alert>
    );
  }

  if (!clearance) {
    return <Alert severity="info">No clearance information available.</Alert>;
  }

  const applications = clearance.applications || [];
  const latestApplication = applications[0];

  const departmentStatuses = latestApplication?.departmentWiseStatus || [];

  const clearedCount = departmentStatuses.filter((item) => item.status === 'CLEAR').length;

  const totalCount = departmentStatuses.length;

  const overallStatus = latestApplication?.overallStatus || 'PENDING';

  const overallDetails = getStatusDetails(overallStatus);

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
            Track department-wise clearance status.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshOutlinedIcon />}
          onClick={handleRetry}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to refresh the latest clearance information.
        </Alert>
      )}

      {/* No Application */}
      {!latestApplication ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <DescriptionOutlinedIcon sx={{ fontSize: 42, color: 'text.secondary', mb: 1 }} />

          <Typography variant="h6" fontWeight={600}>
            No Clearance Application Found
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No transfer certificate clearance application has been submitted for this student yet.
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Overall Status */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, mb: 3 }}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={2}
            >
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Overall Clearance Status
                </Typography>

                <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                  {overallDetails.label}
                </Typography>
              </Box>

              <Chip label={overallDetails.label} color={overallDetails.color} variant="outlined" />
            </Stack>
          </Paper>

          {/* Summary */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Departments Cleared
                </Typography>

                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {clearedCount}/{totalCount}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Completed department clearances
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
                <Typography variant="body2" color="text.secondary">
                  Pending Departments
                </Typography>

                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {departmentStatuses.filter((item) => item.status !== 'CLEAR').length}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Awaiting clearance updates
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Department-wise Status */}
          <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Department-wise Status
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Live clearance updates received from departments.
              </Typography>
            </Box>

            <Divider />

            {departmentStatuses.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary" align="center">
                  No department clearance records found.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0} divider={<Divider />}>
                {departmentStatuses.map((item, index) => {
                  const status = getStatusDetails(item.status);

                  return (
                    <Box
                      key={item.itemId || item.departmentId || index}
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
                        <Typography fontWeight={600}>{item.departmentName}</Typography>

                        <Typography variant="caption" color="text.secondary">
                          {item.remark || 'No remarks available'}
                        </Typography>
                      </Box>

                      <Chip
                        label={status.label}
                        color={status.color}
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* TC Information */}
          <Paper variant="outlined" sx={{ mt: 3, p: 2.5, borderRadius: 2 }}>
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
                  TC generation is handled through the Transfer Certificate module.
                </Typography>
              </Box>

              <Button variant="outlined" startIcon={<DescriptionOutlinedIcon />} disabled>
                Generate TC
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default StudentClearanceTab;
