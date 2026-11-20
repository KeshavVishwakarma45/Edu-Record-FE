import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs, Typography } from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

import PageHeader from '@/components/PageHeader';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

import FormTextField from '@/components/form/FormTextField';
import FormDateField from '@/components/form/FormDateField';
import FormSelect from '@/components/form/FormSelect';

import { studentsApi } from '@/api/students';
import { coursesApi } from '@/api/courses';

import { useRequest } from '@/hooks/useRequest';
import { useList } from '@/hooks/useList';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';

import { GENDER_LIST } from '@/constants/genders';
import { CATEGORY_LIST } from '@/constants/categories';

import StudentProfileHeader from './components/StudentProfileHeader';
import StudentResultsTab from './components/StudentResultsTab';
import StudentDocumentsTab from './components/StudentDocumentsTab';
import StudentClearanceTab from './components/StudentClearanceTab';
import StudentTCTab from './components/StudentTCTab';
import StudentHistoryTab from './components/StudentHistoryTab';

const genderOptions = GENDER_LIST.map((value) => ({
  value,
  label: value,
}));

const categoryOptions = CATEGORY_LIST.map((value) => ({
  value,
  label: value,
}));

const validatePersonName = (value) => {
  const trimmed = String(value ?? '').trim();

  if (!trimmed) return 'Name is required';

  return /^[\p{L}\p{M}\s.'’-]+$/u.test(trimmed) || 'Enter a valid name';
};

const validateMobile = (value) => {
  const trimmed = String(value ?? '').trim();

  return /^[6-9]\d{9}$/.test(trimmed) || 'Enter a valid 10-digit Indian mobile number';
};

const validateAdmissionDate = (value, formValues) => {
  if (!value || !formValues.dob) return true;

  return value >= formValues.dob || 'Admission date cannot be before date of birth';
};

const StudentProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { selectedInstitute, allInstitutes } = useAuth();
  const notify = useNotify();

  const [activeTab, setActiveTab] = useState(0);
  const [student, setStudent] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { run: getStudent, loading, error } = useRequest(studentsApi.getById);

  const { run: updateStudent, loading: updateLoading } = useRequest(studentsApi.update);

  const { run: deleteStudent, loading: deleteLoading } = useRequest(studentsApi.remove);

  const {
    rows: courses,
    loading: coursesLoading,
    error: coursesError,
  } = useList(coursesApi.list, { sort: 'name' });

  const courseOptions = courses.map((course) => ({
    value: course._id,
    label: `${course.name} (${course.shortCode})`,
  }));

  const loadStudent = async () => {
    const data = await getStudent(id);
    setStudent(data);
    return data;
  };

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

  const handleEdit = async (values) => {
    if (allInstitutes || !selectedInstitute?.id) {
      notify.error('Please select one institute first');
      return;
    }

    const payload = {
      scholarNo: values.scholarNo,
      enrollmentNo: values.enrollmentNo,
      rollNo: values.rollNo,
      name: values.name,
      fatherName: values.fatherName,
      motherName: values.motherName,
      dob: values.dob,
      gender: values.gender,
      category: values.category,
      admissionDate: values.admissionDate,
      mobile: values.mobile,
      religion: values.religion,
      address: values.address,
      previousSchool: values.previousSchool,
      courseId: values.courseId,
      branch: values.branch,
      batch: values.batch,
    };

    await updateStudent(id, payload, selectedInstitute.id);

    await loadStudent();

    setEditOpen(false);
    notify.success('Student details updated successfully');
  };

  const handleDelete = async () => {
    if (allInstitutes || !selectedInstitute?.id) {
      notify.error('Please select one institute first');
      return;
    }

    await deleteStudent(id, selectedInstitute.id);

    setDeleteOpen(false);
    notify.success('Student deleted successfully');
    navigate('/students');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const tabs = ['Results', 'Documents', 'Clearance', 'TC', 'History'];

  const editDefaults = {
    scholarNo: student?.scholarNo ?? '',
    enrollmentNo: student?.enrollmentNo ?? '',
    rollNo: student?.rollNo ?? '',
    name: student?.name ?? '',
    fatherName: student?.fatherName ?? '',
    motherName: student?.motherName ?? '',
    dob: student?.dob ? String(student.dob).slice(0, 10) : null,
    gender: student?.gender ?? '',
    category: student?.category ?? '',
    admissionDate: student?.admissionDate ? String(student.admissionDate).slice(0, 10) : null,
    mobile: student?.mobile ?? '',
    religion: student?.religion ?? '',
    address: student?.address ?? '',
    previousSchool: student?.previousSchool ?? '',
    courseId: String(student?.courseId?._id ?? student?.courseId ?? ''),
    branch: student?.branch ?? '',
    batch: student?.batch ?? '',
  };

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
              onClick={() => loadStudent().catch(() => setStudent(null))}
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
            <StudentProfileHeader student={student} onPhotoUploaded={loadStudent} />
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1,
              mt: 2,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => setEditOpen(true)}
              disabled={allInstitutes || !selectedInstitute?.id}
            >
              Edit Student
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlinedIcon />}
              onClick={() => setDeleteOpen(true)}
              disabled={allInstitutes || !selectedInstitute?.id}
            >
              Delete Student
            </Button>
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
              {activeTab === 2 && <StudentClearanceTab studentId={id} />}
              {activeTab === 3 && <StudentTCTab />}
              {activeTab === 4 && <StudentHistoryTab />}
            </Box>
          </Paper>

          <FormDialog
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title="Edit Student"
            defaultValues={editDefaults}
            onSubmit={handleEdit}
            loading={updateLoading}
            submitLabel="Update Student"
          >
            <FormTextField
              name="scholarNo"
              label="Scholar Number"
              rules={{ required: 'Scholar number is required' }}
              fullWidth
            />

            <FormTextField name="enrollmentNo" label="Enrollment Number" fullWidth />

            <FormTextField name="rollNo" label="Roll Number" fullWidth />

            <FormTextField
              name="name"
              label="Student Name"
              rules={{
                required: 'Student name is required',
                validate: validatePersonName,
              }}
              fullWidth
            />

            <FormTextField
              name="fatherName"
              label="Father's Name"
              rules={{
                required: "Father's name is required",
                validate: validatePersonName,
              }}
              fullWidth
            />

            <FormTextField name="motherName" label="Mother's Name" fullWidth />

            <FormDateField
              name="dob"
              label="Date of Birth"
              rules={{ required: 'Date of birth is required' }}
              disableFuture
              slotProps={{ textField: { fullWidth: true } }}
            />

            <FormSelect
              name="gender"
              label="Gender"
              options={genderOptions}
              rules={{ required: 'Please select gender' }}
              fullWidth
            />

            <FormSelect
              name="category"
              label="Category"
              options={categoryOptions}
              rules={{ required: 'Please select category' }}
              fullWidth
            />

            <FormDateField
              name="admissionDate"
              label="Admission Date"
              rules={{
                required: 'Admission date is required',
                validate: validateAdmissionDate,
                deps: ['dob'],
              }}
              disableFuture
              slotProps={{ textField: { fullWidth: true } }}
            />

            <FormTextField
              name="mobile"
              label="Mobile Number"
              type="tel"
              rules={{
                required: 'Mobile number is required',
                validate: validateMobile,
              }}
              fullWidth
            />

            <FormTextField name="religion" label="Religion" fullWidth />

            <FormTextField name="address" label="Address" multiline rows={3} fullWidth />

            <FormTextField name="previousSchool" label="Previous School" fullWidth />

            <FormSelect
              name="courseId"
              label="Course"
              options={courseOptions}
              rules={{ required: 'Please select a course' }}
              disabled={coursesLoading || Boolean(coursesError) || !courseOptions.length}
              helperText={
                coursesError ? 'Unable to load courses' : coursesLoading ? 'Loading courses...' : ''
              }
              fullWidth
            />

            <FormTextField name="branch" label="Branch" fullWidth />

            <FormTextField name="batch" label="Batch" fullWidth />
          </FormDialog>

          <ConfirmDialog
            open={deleteOpen}
            title="Delete Student?"
            message={`Are you sure you want to delete ${student.name}? This student will be moved to deleted records.`}
            confirmLabel="Delete Student"
            danger
            loading={deleteLoading}
            onConfirm={handleDelete}
            onClose={() => setDeleteOpen(false)}
          />
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
