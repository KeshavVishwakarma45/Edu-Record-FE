/*
 * HOW TO COPY THIS PAGE FOR A NEW MODULE
 * 1. Make the API file first: copy src/api/courses.js to src/api/<module>.js and change the URLs.
 * 2. Copy this file to src/pages/<module>/<Module>Page.jsx and rename "course" everywhere.
 * 3. Add the page to src/routes/routes.jsx with its `permission` and its menu entry; hide write
 *    buttons with can(PERMISSIONS.X) from useAuth(), like canWrite below.
 * 4. Change `columns` to what your list shows. Mark a column sortable only if the server's
 *    listQuery([...]) allows that field.
 * 5. Change <CourseFields> to your form fields, using the Form* components and the SAME rules
 *    as the server's Joi schema (the server stays the authority).
 * 6. Send every change to the record's own institute (row.instituteId, see handleSave), so it
 *    also works in the Super Admin's "All institutes" view. DataTable adds the Institute column.
 * 7. Test as every role that should and should not see it, and at 360 px phone width.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { coursesApi } from '@/api/courses';
import { PERMISSIONS } from '@/constants/permissions';
import {
  COURSE_PATTERNS,
  COURSE_PATTERN_LIST,
  COURSE_PATTERN_LABELS,
} from '@/constants/coursePatterns';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormTextField from '@/components/form/FormTextField';
import FormSelect from '@/components/form/FormSelect';
import FormNumberField from '@/components/form/FormNumberField';
import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

// ---- Table ------------------------------------------------------------------------------

const unitName = (course) => (course.pattern === COURSE_PATTERNS.SEMESTER ? 'semesters' : 'years');

const columns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'shortCode', header: 'Short code', sortable: true },
  { field: 'branch', header: 'Branch', sortable: true, render: (course) => course.branch || '—' },
  {
    field: 'pattern',
    header: 'Pattern',
    render: (course) => COURSE_PATTERN_LABELS[course.pattern],
  },
  {
    field: 'duration',
    header: 'Duration',
    sortable: true,
    render: (course) => `${course.duration} ${unitName(course)}`,
  },
];

// ---- Form -------------------------------------------------------------------------------

const NEW_COURSE = {
  instituteId: '', // the selected institute; the Super Admin chooses it in "All institutes"
  affiliationId: '',
  name: '',
  shortCode: '',
  branch: '',
  pattern: COURSE_PATTERNS.YEAR,
  duration: 3,
  examTerms: '',
};

const patternOptions = COURSE_PATTERN_LIST.map((value) => ({
  value,
  label: COURSE_PATTERN_LABELS[value],
}));

// The form edits exam terms as one line of text: "Year I, Year II, Year III"
const splitTerms = (text) =>
  text
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);

const toFormValues = (course) => ({
  instituteId: course.instituteId,
  affiliationId: course.affiliationId,
  name: course.name,
  shortCode: course.shortCode,
  branch: course.branch,
  pattern: course.pattern,
  duration: course.duration,
  examTerms: course.examTerms.join(', '),
});

function toApiData({ examTerms, ...values }) {
  const terms = splitTerms(examTerms);
  // No terms typed: leave them out and the server builds them from pattern + duration
  return terms.length > 0 ? { ...values, examTerms: terms } : values;
}

// The fields inside the dialog. It loads the affiliation choices of the course's institute.
// isNew: adding (in "All institutes" the Super Admin first chooses the institute).
function CourseFields({ isNew }) {
  const { allInstitutes, realInstitutes } = useAuth();
  const { setValue } = useFormContext();
  const instituteId = useWatch({ name: 'instituteId' });
  const [loaded, setLoaded] = useState({ instituteId: null, affiliations: [] });
  const notify = useNotify();

  useEffect(() => {
    if (!instituteId) return;
    coursesApi
      .options(instituteId)
      .then((options) => setLoaded({ instituteId, affiliations: options.affiliations }))
      .catch(notify.error);
    // Another institute has other affiliations: the old choice no longer fits
    if (isNew) setValue('affiliationId', '');
  }, [instituteId, isNew, setValue, notify]);

  const affiliations = loaded.instituteId === instituteId ? loaded.affiliations : [];

  return (
    <>
      {allInstitutes && isNew && (
        <FormSelect
          name="instituteId"
          label="Institute"
          options={realInstitutes.map((i) => ({
            value: i.id,
            label: `${i.shortCode} · ${i.name}`,
          }))}
          rules={{ required: 'Choose the institute' }}
        />
      )}
      <FormTextField
        name="name"
        label="Name"
        rules={{
          required: 'Enter the course name',
          minLength: { value: 2, message: 'At least 2 characters' },
          maxLength: { value: 100, message: 'At most 100 characters' },
        }}
      />
      <FormTextField
        name="shortCode"
        label="Short code"
        helperText="Printed in the TC Ref no., e.g. B.Com"
        rules={{
          required: 'Enter the short code',
          maxLength: { value: 20, message: 'At most 20 characters' },
        }}
      />
      <FormTextField
        name="branch"
        label="Branch"
        helperText="Leave empty if the course has no branches"
        rules={{ maxLength: { value: 50, message: 'At most 50 characters' } }}
      />
      <FormSelect
        name="affiliationId"
        label="Affiliation"
        options={affiliations}
        rules={{ required: 'Choose the affiliation' }}
      />
      <FormSelect
        name="pattern"
        label="Pattern"
        options={patternOptions}
        rules={{ required: 'Choose a pattern' }}
      />
      <FormNumberField
        name="duration"
        label="Duration (number of semesters or years)"
        min={1}
        max={12}
        rules={{
          required: 'Enter the duration',
          min: { value: 1, message: 'At least 1' },
          max: { value: 12, message: 'At most 12' },
        }}
      />
      <FormTextField
        name="examTerms"
        label="Exam terms"
        helperText="Separate with commas. Leave empty to fill from pattern and duration."
        rules={{
          validate: (text, values) =>
            splitTerms(text).length === 0 ||
            splitTerms(text).length === Number(values.duration) ||
            `Enter ${values.duration} terms, or leave empty`,
        }}
      />
    </>
  );
}

// ---- Page -------------------------------------------------------------------------------

export default function CoursesPage({ startWithAddDialog = false }) {
  const navigate = useNavigate();
  const notify = useNotify();
  const { can, selectedInstitute, allInstitutes } = useAuth();
  const canWrite = can(PERMISSIONS.COURSE_WRITE);

  // Reloads by itself when page, sort, search or the selected institute change
  const list = useList(coursesApi.list, { sort: 'name' });
  const createRequest = useRequest(coursesApi.create);
  const updateRequest = useRequest(coursesApi.update);
  const removeRequest = useRequest(coursesApi.remove);

  // editing: null = dialog closed, NEW_COURSE = adding, a course = editing that course
  const [editing, setEditing] = useState(startWithAddDialog ? NEW_COURSE : null);
  const newCourse = { ...NEW_COURSE, instituteId: allInstitutes ? '' : selectedInstitute?.id };
  const [deleting, setDeleting] = useState(null);

  const closeDialog = () => {
    setEditing(null);
    if (startWithAddDialog) navigate('/courses', { replace: true });
  };

  // Errors are not caught here: FormDialog shows them on the fields and keeps the dialog open
  // Every change goes to the course's own institute (needed in the "All institutes" view)
  const handleSave = async ({ instituteId, ...values }) => {
    const data = toApiData(values);
    if (editing._id) {
      await updateRequest.run(editing._id, data, editing.instituteId);
      notify.success('Course updated');
    } else {
      await createRequest.run(data, instituteId);
      notify.success('Course added');
    }
    closeDialog();
    list.reload();
  };

  const handleDelete = async () => {
    try {
      await removeRequest.run(deleting._id, deleting.instituteId);
      notify.success('Course deleted');
      setDeleting(null);
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = canWrite
    ? [
        { label: 'Edit', icon: EditOutlinedIcon, onClick: setEditing },
        { label: 'Delete', icon: DeleteOutlinedIcon, onClick: setDeleting, color: 'error' },
      ]
    : [];

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle={
          allInstitutes
            ? 'Courses of every institute'
            : `Courses offered by ${selectedInstitute?.name ?? 'this institute'}`
        }
        actions={
          canWrite && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEditing(NEW_COURSE)}
            >
              Add course
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        rows={list.rows}
        total={list.total}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        params={list.params}
        onParamsChange={list.setParams}
        rowActions={rowActions}
        searchPlaceholder="Name, short code or branch"
        emptyText="No courses found"
      />

      <FormDialog
        open={Boolean(editing)}
        title={editing?._id ? 'Edit course' : 'Add course'}
        defaultValues={editing?._id ? toFormValues(editing) : newCourse}
        submitLabel={editing?._id ? 'Save changes' : 'Add course'}
        loading={createRequest.loading || updateRequest.loading}
        onSubmit={handleSave}
        onClose={closeDialog}
      >
        <CourseFields isNew={!editing?._id} />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete course?"
        message={deleting ? `"${deleting.name}" will be deleted. This cannot be undone.` : ''}
        confirmLabel="Delete"
        danger
        loading={removeRequest.loading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
