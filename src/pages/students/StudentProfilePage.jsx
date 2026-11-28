import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Alert, Box, Button, CircularProgress, Paper, Tab, Tabs } from '@mui/material';

import PageHeader from '@/components/PageHeader';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';

import FormTextField from '@/components/form/FormTextField';
import FormDateField from '@/components/form/FormDateField';
import FormSelect from '@/components/form/FormSelect';

import { studentsApi } from '@/api/students';
import { coursesApi } from '@/api/courses';

import { useRequest } from '@/hooks/useRequest';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';

import { GENDER_LIST } from '@/constants/genders';
import { CATEGORY_LIST } from '@/constants/categories';
import { PERMISSIONS } from '@/constants/permissions';

import StudentProfileHeader from './components/StudentProfileHeader';
import StudentResultsTab from './components/StudentResultsTab';
import StudentDocumentsTab from './components/StudentDocumentsTab';
import StudentClearanceTab from './components/StudentClearanceTab';
import StudentTCTab from './components/StudentTCTab';
import StudentHistoryTab from './components/StudentHistoryTab';

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

  const { selectedInstitute, can } = useAuth();
  const notify = useNotify();

  const canReadStudent = can(PERMISSIONS.STUDENT_READ);
  const canWriteStudent = can(PERMISSIONS.STUDENT_WRITE);
  const canIssueHandover = can(PERMISSIONS.HANDOVER_ISSUE);

  const [activeTab, setActiveTab] = useState(0);
  const [student, setStudent] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState(null);

  const { run: getStudent, loading, error } = useRequest(studentsApi.getById);

  const { run: updateStudent, loading: updateLoading } = useRequest(studentsApi.update);

  const { run: deleteStudent, loading: deleteLoading } = useRequest(studentsApi.remove);

  const { run: uploadPhoto, loading: photoUploading } = useRequest(studentsApi.uploadPhoto);

  const instituteId = student?.instituteId?._id || student?.instituteId || selectedInstitute?.id;

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

  useEffect(() => {
    let isActive = true;

    const loadCourses = async () => {
      if (!instituteId) {
        setCourses([]);
        return;
      }

      setCoursesLoading(true);
      setCoursesError(null);

      try {
        const result = await coursesApi.list(
          {
            page: 1,
            limit: 100,
            sort: 'name',
          },
          instituteId,
        );

        if (isActive) {
          setCourses(Array.isArray(result) ? result : []);
        }
      } catch (loadError) {
        if (isActive) {
          setCourses([]);
          setCoursesError(loadError);
        }
      } finally {
        if (isActive) {
          setCoursesLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isActive = false;
    };
  }, [instituteId]);

  const courseOptions = courses.map((course) => ({
    value: course._id,
    label: `${course.name} (${course.shortCode || '—'})`,
  }));

  const handleEdit = async (values) => {
    if (!canWriteStudent) {
      notify.error('You do not have permission to edit students');
      return;
    }

    if (!instituteId) {
      notify.error('Student institute information is unavailable');
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

    try {
      await updateStudent(id, payload, instituteId);
      await loadStudent();

      setEditOpen(false);
      notify.success('Student details updated successfully');
    } catch (updateError) {
      notify.error(updateError?.message || 'Unable to update student details');
    }
  };

  const handleDelete = async () => {
    if (!canWriteStudent) {
      notify.error('You do not have permission to delete students');
      return;
    }

    if (!instituteId) {
      notify.error('Student institute information is unavailable');
      return;
    }

    try {
      await deleteStudent(id, instituteId);

      setDeleteOpen(false);
      notify.success('Student deleted successfully');
      navigate('/students');
    } catch (deleteError) {
      notify.error(deleteError?.message || 'Unable to delete student');
    }
  };

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!canWriteStudent) {
      notify.error('You do not have permission to upload student photos');
      return;
    }

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      notify.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      notify.error('Photo size must be 2 MB or smaller');
      return;
    }

    if (!instituteId) {
      notify.error('Student institute information is unavailable');
      return;
    }

    try {
      await uploadPhoto(student._id, file, instituteId);
      await loadStudent();

      notify.success('Student photo uploaded successfully');
    } catch (uploadError) {
      notify.error(uploadError?.message || 'Unable to upload student photo');
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMobileInput = (event) => {
    event.target.value = event.target.value.replace(/\D/g, '').slice(0, 10);
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

  if (!canReadStudent) {
    return (
      <Box>
        <PageHeader
          title="Student Profile"
          subtitle="View and manage student information"
          backTo="/students"
        />

        <Alert severity="error" sx={{ mt: 3 }}>
          You do not have permission to view student profiles.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Student Profile"
        subtitle="View and manage student information"
        backTo="/students"
      />

      {loading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            py: 6,
          }}
        >
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
            <StudentProfileHeader
              student={student}
              courses={courses}
              canWrite={canWriteStudent && Boolean(instituteId)}
              photoUploading={photoUploading}
              onPhotoChange={handlePhotoChange}
              onEdit={() => setEditOpen(true)}
              onStartTC={() => setActiveTab(3)}
              onDelete={() => setDeleteOpen(true)}
            />
          </Box>

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

            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {activeTab === 0 && <StudentResultsTab studentId={id} />}

              {activeTab === 1 && (
                <StudentDocumentsTab
                  studentId={student._id}
                  student={student}
                  instituteId={instituteId}
                  canIssueHandover={canIssueHandover}
                />
              )}

              {activeTab === 2 && <StudentClearanceTab studentId={id} />}

              {activeTab === 3 && <StudentTCTab studentId={id} />}

              {activeTab === 4 && <StudentHistoryTab studentId={id} />}
            </Box>
          </Paper>

          {canWriteStudent && (
            <>
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
                  onInput={handleMobileInput}
                  slotProps={{
                    htmlInput: {
                      maxLength: 10,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    },
                  }}
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
                    coursesError
                      ? 'Unable to load courses'
                      : coursesLoading
                        ? 'Loading courses...'
                        : ''
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
