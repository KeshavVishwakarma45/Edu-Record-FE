import { useList } from '@/hooks/useList';
import { coursesApi } from '@/api/courses';

import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';

import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';

import FormTextField from '@/components/form/FormTextField';
import FormDateField from '@/components/form/FormDateField';
import FormSelect from '@/components/form/FormSelect';

import { GENDER_LIST } from '@/constants/genders';
import { CATEGORY_LIST } from '@/constants/categories';

import FormPhotoUpload from '@/components/form/FormPhotoUpload';
import StatusChip from '@/components/StatusChip';
import { studentsApi } from '@/api/students';

import { Box, Button } from '@mui/material';
import BulkImportButton from './BulkImportButton';
import { useNavigate } from 'react-router-dom';

import dayjs from 'dayjs';
import { useAuth } from '@/hooks/useAuth';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

const genderOptions = GENDER_LIST.map((gender) => ({
  value: gender,
  label: gender,
}));

const categoryOptions = CATEGORY_LIST.map((category) => ({
  value: category,
  label: category,
}));

const validateNotBlank = (value) => {
  return Boolean(String(value ?? '').trim()) || 'This field cannot be empty';
};

const validatePersonName = (value) => {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return 'Name is required';
  }

  return (
    /^[\p{L}\p{M}\s.'’-]+$/u.test(trimmedValue) ||
    'Only letters, spaces, dots, hyphens and apostrophes are allowed'
  );
};

const validateMobile = (value) => {
  const trimmedValue = String(value ?? '').trim();

  if (!trimmedValue) {
    return 'Mobile no is required';
  }

  return /^[6-9]\d{9}$/.test(trimmedValue) || 'Enter a valid 10-digit Indian mobile number';
};

const validateAdmissionDate = (value, formValues) => {
  if (!value || !formValues.dob) {
    return true;
  }

  if (value < formValues.dob) {
    return 'Admission date cannot be before date of birth';
  }

  return true;
};

const columns = [
  { field: 'scholarNo', header: 'Scholar No.', sortable: true },
  { field: 'enrollmentNo', header: 'Enrollment No.', sortable: true },
  { field: 'rollNo', header: 'Roll No.', sortable: true },
  { field: 'name', header: 'Student Name', sortable: true },
  { field: 'fatherName', header: "Father's Name", sortable: true },
  { field: 'mobile', header: 'Mobile' },
  {
    field: 'status',
    header: 'Status',
    render: (row) => <StatusChip status={row.status} />,
  },
];

export default function StudentsPage() {
  const { selectedInstitute, allInstitutes } = useAuth();
  const notify = useNotify();

  const { run: createStudent, loading: createLoading } = useRequest(studentsApi.create);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const {
    rows: studentRows,
    total: studentTotal,
    loading: studentsLoading,
    error: studentsError,
    params: tableParams,
    setParams: setTableParams,
    reload: reloadStudents,
  } = useList(studentsApi.list, {
    page: 1,
    limit: 10,
    sort: 'createdAt',
    search: '',
  });

  const {
    rows: courses,
    loading: coursesLoading,
    error: coursesError,
  } = useList(coursesApi.list, { sort: 'name' });

  const courseOptions = courses.map((course) => ({
    value: course._id,
    label: `${course.name} (${course.shortCode})`,
  }));

  const handleSave = async (values) => {
    if (allInstitutes || !selectedInstitute?.id) {
      notify.error('Please select one institute first');
      return;
    }

    const { photo, ...studentData } = values;

    const payload = {
      ...studentData,
      dob: dayjs(values.dob).format('YYYY-MM-DD'),
      admissionDate: dayjs(values.admissionDate).format('YYYY-MM-DD'),
    };

    await createStudent(payload, selectedInstitute.id);

    notify.success('Student added successfully');
    setOpen(false);
    reloadStudents();
  };

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Manage student records"
        actions={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <BulkImportButton onImported={reloadStudents} />

            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
              Add Student
            </Button>
          </Box>
        }
      />

      <DataTable
        columns={columns}
        rows={studentRows}
        total={studentTotal}
        loading={studentsLoading}
        error={studentsError}
        onRetry={reloadStudents}
        params={tableParams}
        onParamsChange={setTableParams}
        onRowClick={(row) => navigate(`/students/${row._id}`)}
        searchPlaceholder="Search by name, scholar no., enrollment no. or mobile"
        emptyText="Student records will appear here"
      />

      <FormDialog
        open={open}
        title="Add Student"

        defaultValues={{
          scholarNo: '',
          enrollmentNo: '',
          rollNo: '',
          name: '',
          fatherName: '',
          motherName: '',
          dob: null,
          gender: '',
          category: '',
          admissionDate: null,
          mobile: '',
          religion: '',
          address: '',
          previousSchool: '',
          photo: null,
          courseId: '',
          branch: '',
          batch: '',
        }}

        onSubmit={handleSave}
        loading={createLoading}
        onClose={() => setOpen(false)}
        submitLabel="Save Student"
      >
        <FormTextField
          name="scholarNo"
          label="Scholar Number"
          rules={{
            required: 'Scholar number is required',
            validate: validateNotBlank,
          }}
          fullWidth
        />

        <FormTextField
          name="enrollmentNo"
          label="Enrollment Number"
          rules={{
            validate: (value) => {
              if (!String(value ?? '').trim()) return true;
              return validateNotBlank(value);
            },
          }}
          fullWidth
        />

        <FormTextField
          name="rollNo"
          label="Roll Number"
          rules={{
            validate: (value) => {
              if (!String(value ?? '').trim()) return true;
              return validateNotBlank(value);
            },
          }}
          fullWidth
        />

        <FormTextField
          name="name"
          label="Student Name"
          rules={{ required: 'Student name is required', validate: validatePersonName }}
          fullWidth
        />

        <FormTextField
          name="fatherName"
          label="Father's Name"
          rules={{ required: "Father's name is required", validate: validatePersonName }}
          fullWidth
        />

        <FormTextField
          name="motherName"
          label="Mother's Name"
          rules={{
            validate: (value) => {
              if (!String(value ?? '').trim()) return true;
              return validatePersonName(value);
            },
          }}
          fullWidth
        />

        <FormDateField
          name="dob"
          label="Date of Birth"
          rules={{
            required: 'Date of birth is required',
          }}
          disableFuture
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
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
          slotProps={{
            textField: {
              fullWidth: true,
            },
          }}
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

        <FormTextField
          name="religion"
          label="Religion"
          rules={{
            validate: (value) => {
              if (!String(value ?? '').trim()) return true;
              return validatePersonName(value);
            },
          }}

          fullWidth
        />

        <FormTextField
          name="address"
          label="Address"
          multiline
          rows={3}
          rules={{
            validate: (value) => Boolean(String(value ?? '').trim()) || 'Address cannot be empty',
          }}
          fullWidth
        />

        <FormTextField
          name="previousSchool"
          label="Previous School"
          rules={{
            validate: (value) => {
              if (!String(value ?? '').trim()) return true;
              return validateNotBlank(value);
            },
          }}
          fullWidth
        />

        <FormPhotoUpload name="photo" label="Student Photo" />

        <FormSelect
          name="courseId"
          label="Course"
          options={courseOptions}
          rules={{
            required: 'Please select a course',
            validate: (value) => {
              if (!value) {
                return 'Please select a course';
              }

              return (
                courseOptions.some((course) => course.value === value) ||
                'Please select a valid course'
              );
            },
          }}
          disabled={coursesLoading || coursesError || courseOptions.length === 0}
          helperText={
            coursesError
              ? 'Unable to load courses'
              : coursesLoading
                ? 'Loading courses...'
                : courseOptions.length === 0
                  ? 'No courses available'
                  : ''
          }
          fullWidth
        />

        <FormTextField
          name="branch"
          label="Branch"
          rules={{
            validate: (value) => Boolean(String(value ?? '').trim()) || 'Branch cannot be empty',
          }}
          fullWidth
        />

        <FormTextField
          name="batch"
          label="Batch"
          rules={{
            validate: (value) => Boolean(String(value ?? '').trim()) || 'Batch cannot be empty',
          }}
          fullWidth
        />
      </FormDialog>
    </>
  );
}
