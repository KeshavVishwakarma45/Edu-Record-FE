import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { rolesApi } from '@/api/roles';
import { PERMISSION_GROUPS, PERMISSION_LIST } from '@/constants/permissions';
import { OWNER_TYPES } from '@/constants/ownerTypes';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import InstituteBadges from '@/components/InstituteBadges';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import FormTextField from '@/components/form/FormTextField';
import FormSelect from '@/components/form/FormSelect';
import FormCheckboxGroup from '@/components/form/FormCheckboxGroup';
import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

// Roles of the selected institute, or of its unit when institutes are combined (ADR-016).
// A role is a name plus permissions; the code checks permissions, never role names.
// Each institute or unit has its own roles. In the "All institutes" view the Super Admin sees
// them all and chooses which institute / unit a new role is for.
// A unit's role can be used in only some of its institutes ("Used in"): staff with that role can
// open only those institutes.

const columns = [
  { field: 'name', header: 'Role', sortable: true },
  { field: 'description', header: 'Description', render: (role) => role.description || '—' },
  {
    field: 'permissions',
    header: 'Permissions',
    render: (role) => `${role.permissions.length} of ${PERMISSION_LIST.length}`,
  },
  { field: 'userCount', header: 'Users' },
];

// "All institutes": who owns the role (unit name) and where it is used
const ownerColumn = {
  field: 'ownerName',
  header: 'Institute / unit',
  render: (role) => (
    <InstituteBadges
      caption={role.ownerType === OWNER_TYPES.UNIT ? role.ownerName : undefined}
      shortCodes={role.usedIn}
    />
  ),
};
// One institute of a unit selected: where each of the unit's roles is used
const usedInColumn = {
  field: 'usedIn',
  header: 'Used in',
  render: (role) => <InstituteBadges shortCodes={role.usedIn} />,
};

const NEW_ROLE = {
  ownerInstituteId: '', // an institute of the owner (the selected one, or chosen in "All")
  template: '',
  name: '',
  description: '',
  permissions: [],
  instituteIds: [], // unit roles: the member institutes that use the role
};

// "Used in" tick boxes, shown only when the role belongs to a unit.
// membersOf(instituteId) -> the institutes of that institute's unit ([] if separate)
function UsedInField({ membersOf, isNew }) {
  const ownerInstituteId = useWatch({ name: 'ownerInstituteId' });
  const { setValue } = useFormContext();
  const members = membersOf(ownerInstituteId);
  const memberKey = members.map((m) => m.id).join();

  // A new role starts used in every institute of the unit
  useEffect(() => {
    if (isNew) setValue('instituteIds', memberKey ? memberKey.split(',') : []);
  }, [isNew, memberKey, setValue]);

  if (members.length < 2) return null;
  return (
    <FormCheckboxGroup
      name="instituteIds"
      label="Used in"
      helperText="Staff with this role can open only the ticked institutes"
      groups={[
        {
          label: 'Institutes of the unit',
          permissions: members.map((m) => ({ value: m.id, label: `${m.shortCode} · ${m.name}` })),
        },
      ]}
      rules={{ validate: (value) => value.length > 0 || 'Tick at least one institute' }}
    />
  );
}

// "Start from a built-in role": fills name, description and permissions, which can then be changed.
// grantable: the permissions this admin may hand out (others are left unticked).
function TemplatePicker({ grantable }) {
  const [templates, setTemplates] = useState([]);
  const { setValue } = useFormContext();
  const template = useWatch({ name: 'template' });
  const notify = useNotify();

  useEffect(() => {
    rolesApi.templates().then(setTemplates).catch(notify.error);
  }, [notify]);

  useEffect(() => {
    const chosen = templates.find((t) => t.name === template);
    if (!chosen) return;
    setValue('name', chosen.name);
    setValue('description', chosen.description);
    setValue(
      'permissions',
      chosen.permissions.filter((p) => grantable.includes(p)),
    );
  }, [template, templates, grantable, setValue]);

  return (
    <FormSelect
      name="template"
      label="Start from a built-in role (optional)"
      options={[
        { value: '', label: 'Start empty' },
        ...templates.map((t) => ({ value: t.name, label: t.name })),
      ]}
      helperText="Fills the form below; change anything before saving"
    />
  );
}

export default function RolesPage() {
  const notify = useNotify();
  const { selectedInstitute, permissions, isSuperAdmin, allInstitutes, owners, realInstitutes } =
    useAuth();
  const list = useList(rolesApi.list, { sort: 'name' });
  const createRequest = useRequest(rolesApi.create);
  const updateRequest = useRequest(rolesApi.update);
  const removeRequest = useRequest(rolesApi.remove);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // An admin can only hand out permissions they have themselves (the server checks this too)
  const groups = isSuperAdmin
    ? PERMISSION_GROUPS
    : PERMISSION_GROUPS.map((g) => ({
        ...g,
        permissions: g.permissions.filter((p) => permissions.includes(p.value)),
      })).filter((g) => g.permissions.length > 0);

  const grantable = isSuperAdmin ? PERMISSION_LIST : permissions;

  const owner = selectedInstitute?.unit
    ? `${selectedInstitute.unit.name} (shared by its institutes)`
    : selectedInstitute?.name;

  // The institutes of the unit that this institute belongs to ([] for a separate institute)
  const membersOf = (instituteId) => {
    const unitId = realInstitutes.find((i) => i.id === String(instituteId))?.unit?.id;
    return unitId ? realInstitutes.filter((i) => i.unit?.id === unitId) : [];
  };
  const unitSelected = Boolean(selectedInstitute?.unit);

  const formValues = (role) => {
    const members = membersOf(role.ownerInstituteId).map((m) => m.id);
    return {
      ownerInstituteId: role.ownerInstituteId,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      instituteIds: role.instituteIds?.length ? role.instituteIds.map(String) : members,
    };
  };

  // Every change goes to the role's own institute / unit (needed in the "All institutes" view)
  const handleSave = async ({ ownerInstituteId, template: _template, instituteIds, ...values }) => {
    const data = membersOf(ownerInstituteId).length > 1 ? { ...values, instituteIds } : values;
    if (editing._id) {
      await updateRequest.run(editing._id, data, editing.ownerInstituteId);
      notify.success('Role updated');
    } else {
      await createRequest.run(data, ownerInstituteId);
      notify.success('Role added');
    }
    setEditing(null);
    list.reload();
  };

  const handleDelete = async () => {
    try {
      await removeRequest.run(deleting._id, deleting.ownerInstituteId);
      notify.success('Role deleted');
      setDeleting(null);
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  return (
    <>
      <PageHeader
        title="Roles"
        subtitle={
          allInstitutes
            ? 'Roles of every institute and unit'
            : `Roles of ${owner ?? 'this institute'}`
        }
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditing(NEW_ROLE)}>
            Add role
          </Button>
        }
      />

      <DataTable
        columns={
          allInstitutes
            ? [ownerColumn, ...columns]
            : unitSelected
              ? [...columns.slice(0, 1), usedInColumn, ...columns.slice(1)]
              : columns
        }
        instituteColumn={false}
        rows={list.rows}
        total={list.total}
        loading={list.loading}
        error={list.error}
        onRetry={list.reload}
        params={list.params}
        onParamsChange={list.setParams}
        rowActions={[
          { label: 'Edit', icon: EditOutlinedIcon, onClick: setEditing },
          {
            label: 'Delete',
            icon: DeleteOutlinedIcon,
            onClick: setDeleting,
            color: 'error',
            show: (role) => role.userCount === 0,
          },
        ]}
        searchPlaceholder="Role name"
        emptyText="No roles yet"
      />

      <FormDialog
        open={Boolean(editing)}
        title={
          editing?._id
            ? `Edit role: ${editing.name}${allInstitutes ? ` (${editing.ownerName})` : ''}`
            : 'Add role'
        }
        defaultValues={
          editing?._id
            ? formValues(editing)
            : { ...NEW_ROLE, ownerInstituteId: allInstitutes ? '' : selectedInstitute?.id }
        }
        submitLabel={editing?._id ? 'Save changes' : 'Add role'}
        loading={createRequest.loading || updateRequest.loading}
        onSubmit={handleSave}
        onClose={() => setEditing(null)}
      >
        {!editing?._id && allInstitutes && (
          <FormSelect
            name="ownerInstituteId"
            label="Institute / unit"
            options={owners}
            helperText="Institutes combined in a unit share its roles"
            rules={{ required: 'Choose who this role is for' }}
          />
        )}
        {!editing?._id && <TemplatePicker grantable={grantable} />}
        <FormTextField
          name="name"
          label="Role name"
          rules={{
            required: 'Enter the role name',
            minLength: { value: 2, message: 'At least 2 characters' },
          }}
        />
        <FormTextField name="description" label="Description" />
        <UsedInField membersOf={membersOf} isNew={!editing?._id} />
        <FormCheckboxGroup
          name="permissions"
          label="What can this role do?"
          groups={groups}
          rules={{ validate: (value) => value.length > 0 || 'Tick at least one permission' }}
        />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete role?"
        message={deleting ? `The role "${deleting.name}" will be deleted.` : ''}
        confirmLabel="Delete"
        danger
        loading={removeRequest.loading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
