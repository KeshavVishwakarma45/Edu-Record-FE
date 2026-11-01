import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { organisationApi } from '@/api/organisation';
import { rolesApi } from '@/api/roles';
import FormDialog from '@/components/FormDialog';
import FormTextField from '@/components/form/FormTextField';
import FormSelect from '@/components/form/FormSelect';
import FormNumberField from '@/components/form/FormNumberField';
import FormCheckbox from '@/components/form/FormCheckbox';
import FormCheckboxGroup from '@/components/form/FormCheckboxGroup';
import { useNotify } from '@/hooks/useNotify';

// Add a new institute, or edit one (institute = the existing record when editing).
// A new institute is either separate (the Super Admin picks which built-in roles it starts with;
// more can be added on the Roles page) or joins a unit (uses the unit's roles).

const NEW_INSTITUTE = {
  name: '',
  shortCode: '',
  address: '',
  website: '',
  principalName: '',
  universityId: '',
  affiliatedFrom: '',
  unitId: '',
  defaultDepartments: true,
  // roleTemplates: filled with every built-in role once they load (all ticked)
};

// Which built-in roles a separate institute starts with
function StartingRoles() {
  const [templates, setTemplates] = useState([]);
  const { getValues, setValue } = useFormContext();
  const notify = useNotify();

  useEffect(() => {
    rolesApi
      .templates()
      .then((list) => {
        setTemplates(list);
        if (getValues('roleTemplates') === undefined) {
          setValue(
            'roleTemplates',
            list.map((t) => t.name),
          );
        }
      })
      .catch(notify.error);
  }, [getValues, setValue, notify]);

  return (
    <FormCheckboxGroup
      name="roleTemplates"
      label="Starting roles"
      helperText="Untick roles this institute does not need. You can add or change roles later on the Roles page."
      groups={[
        {
          label: 'Built-in roles',
          permissions: templates.map((t) => ({
            value: t.name,
            label: `${t.name}: ${t.description}`,
          })),
        },
      ]}
    />
  );
}

// Fields only asked when adding: university, where it belongs, default departments
function NewInstituteFields({ units }) {
  const [universities, setUniversities] = useState([]);
  const notify = useNotify();
  const universityId = useWatch({ name: 'universityId' });
  const unitId = useWatch({ name: 'unitId' });

  useEffect(() => {
    organisationApi.universities().then(setUniversities).catch(notify.error);
  }, [notify]);

  return (
    <>
      <FormSelect
        name="universityId"
        label="Affiliated university"
        options={[{ value: '', label: 'Not now' }, ...universities]}
      />
      {universityId && (
        <FormNumberField
          name="affiliatedFrom"
          label="Affiliated since (year)"
          min={1950}
          max={2100}
          rules={{ required: 'Enter the year' }}
        />
      )}
      <FormSelect
        name="unitId"
        label="Roles and staff"
        options={[
          { value: '', label: 'Separate institute: its own roles and staff' },
          ...units.map((u) => ({ value: u.id, label: `Join "${u.name}": shared roles and staff` })),
        ]}
      />
      {!unitId && <StartingRoles />}
      <FormCheckbox
        name="defaultDepartments"
        label="Add the default clearance departments (Sports, Library, Computer Dept, Account Dept)"
      />
    </>
  );
}

// unitRoles: when editing an institute that is in a unit, the unit's roles [{ id, name }].
// The Super Admin ticks the ones this institute uses (e.g. SSISM 2 roles, SSEC 4).
export default function InstituteDialog({
  open,
  institute,
  unitRoles = [],
  units,
  loading,
  onSubmit,
  onClose,
}) {
  const editing = Boolean(institute);
  const inUnit = editing && Boolean(institute.unitId);
  return (
    <FormDialog
      open={open}
      title={editing ? `Edit ${institute.shortCode}` : 'Add institute'}
      defaultValues={
        editing
          ? {
              name: institute.name,
              address: institute.address ?? '',
              website: institute.website ?? '',
              principalName: institute.principalName ?? '',
              ...(inUnit ? { roleIds: (institute.roleIds ?? []).map(String) } : {}),
            }
          : NEW_INSTITUTE
      }
      submitLabel={editing ? 'Save changes' : 'Add institute'}
      loading={loading}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <FormTextField
        name="name"
        label="Institute name"
        rules={{
          required: 'Enter the name',
          minLength: { value: 3, message: 'At least 3 characters' },
        }}
      />
      {!editing && (
        <FormTextField
          name="shortCode"
          label="Short code"
          helperText="Printed in TC numbers, e.g. SSISM. Cannot be changed later."
          slotProps={{ htmlInput: { style: { textTransform: 'uppercase' }, maxLength: 10 } }}
          rules={{
            required: 'Enter the short code',
            pattern: { value: /^[A-Za-z0-9]{2,10}$/, message: 'Use 2 to 10 letters or digits' },
          }}
        />
      )}
      <FormTextField name="address" label="Address" multiline minRows={2} />
      <FormTextField name="website" label="Website (optional)" />
      <FormTextField name="principalName" label="Principal / Director name" />
      {!editing && <NewInstituteFields units={units} />}
      {inUnit && (
        <FormCheckboxGroup
          name="roleIds"
          label={`Roles used in ${institute.shortCode}`}
          helperText={`The unit's roles. Staff whose role is not ticked can no longer open ${institute.shortCode} (they keep the other institutes). Add new roles on the Roles page.`}
          groups={[
            {
              label: 'Roles of the unit',
              permissions: unitRoles.map((r) => ({ value: String(r.id), label: r.name })),
            },
          ]}
        />
      )}
    </FormDialog>
  );
}
