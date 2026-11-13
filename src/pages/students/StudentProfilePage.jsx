import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material';

import PageHeader from '@/components/PageHeader';
import { studentsApi } from '@/api/students';
import { useRequest } from '@/hooks/useRequest';

import StudentProfileHeader from './components/StudentProfileHeader';
import StudentResultsTab from './components/StudentResultsTab';
import StudentDocumentsTab from './components/StudentDocumentsTab';
import StudentClearanceTab from './components/StudentClearanceTab';
import StudentTCTab from './components/StudentTCTab';
import StudentHistoryTab from './components/StudentHistoryTab';

const StudentProfilePage = () => {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState(0);
  const [student, setStudent] = useState(null);

  const { run: getStudent, loading, error } = useRequest(studentsApi.getById);

  useEffect(() => {
    let isActive = true;

    getStudent(id)
      .then((data) => {
        if (isActive) {
          setStudent(data);
        }
      })
      .catch(() => {
        if (isActive) {
          setStudent(null);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id, getStudent]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = ['Results', 'Documents', 'Clearance', 'TC', 'History'];

  return (
    <Box>
      <PageHeader title="Student Profile" subtitle="View and manage student information" />

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                getStudent(id)
                  .then(setStudent)
                  .catch(() => setStudent(null));
              }}
            >
              Retry
            </Button>
          }
        >
          {error.message || 'Unable to load student profile'}
        </Alert>
      )}

      {!loading && !error && student && (
        <>
          <Box sx={{ mt: 3 }}>
            <StudentProfileHeader student={student} />
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Student ID: {id}
          </Typography>

          <Paper sx={{ mt: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Student profile sections"
            >
              {tabs.map((tab) => (
                <Tab key={tab} label={tab} />
              ))}
            </Tabs>

            <Box sx={{ p: 3 }}>
              {activeTab === 0 && <StudentResultsTab />}
              {activeTab === 1 && <StudentDocumentsTab />}
              {activeTab === 2 && <StudentClearanceTab />}
              {activeTab === 3 && <StudentTCTab />}
              {activeTab === 4 && <StudentHistoryTab />}
            </Box>
          </Paper>
        </>
      )}

      {!loading && !error && !student && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          Student not found.
        </Alert>
      )}
    </Box>
  );
};

export default StudentProfilePage;
