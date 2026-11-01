import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Button, Chip } from '@mui/material';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { usersApi } from '@/api/users';
import { USER_STATUSES, USER_STATUS_COLORS } from '@/constants/statuses';
import { OWNER_TYPES } from '@/constants/ownerTypes';
import PageHeader from '@/components/PageHeader';
import DataTable from '@/components/DataTable';
import InstituteBadges from '@/components/InstituteBadges';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import CopyLinkDialog from '@/components/CopyLinkDialog';
import FormTextField from '@/components/form/FormTextField';
import FormSelect from '@/components/form/FormSelect';
import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';
import { formatDateTime } from '@/utils/format';

// Staff of the selected institute, or of its unit when institutes are combined (ADR-016).
// Invites are links the admin copies and sends; the person sets their own password.
// In the "All institutes" view the Super Admin sees everyone (one row per institute / unit a
// person works in) and chooses the institute / unit when inviting.

const columns = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'email', header: 'Email', sortable: true },
  { field: 'roleName', header: 'Role' },
  {
    field: 'status',
    header: 'Status',
    render: (user) => (
      <Chip label={user.status} color={USER_STATUS_COLORS[user.status]} size="small" />
    ),
  },
  {
    field: 'lastLoginAt',
    header: 'Last login',
    render: (user) => formatDateTime(user.lastLoginAt),
  },
];

// "All institutes": where the person works (unit name) and which institutes they can open
const ownerColumn = {
  field: 'ownerName',
  header: 'Institute / unit',
  render: (user) =>
    user.isSuperAdmin ? (
      user.ownerName
    ) : (
      <InstituteBadges
        caption={user.ownerType === OWNER_TYPES.UNIT ? user.ownerName : undefined}
        shortCodes={user.institutes}
      />
    ),
};
// One institute of a unit selected: which of the unit's institutes each person can open
const canOpenColumn = {
  field: 'institutes',
  header: 'Can open',
  render: (user) => (user.isSuperAdmin ? 'All' : <InstituteBadges shortCodes={user.institutes} />),
};

// Role and departments: shared by the invite and change-role forms. Loads the roles and
// departments of the chosen institute / unit (form value ownerInstituteId), so a role added a
// moment ago on the Roles page is already in the list.
function AccessFields() {
  const ownerInstituteId = useWatch({ name: 'ownerInstituteId' });
  const [loaded, setLoaded] = useState({ ownerInstituteId: null, roles: [], departments: [] });
  const notify = useNotify();
  useEffect(() => {
    if (!ownerInstituteId) return;
    usersApi
      .options(ownerInstituteId)
      .then((options) => setLoaded({ ownerInstituteId, ...options }))
      .catch(notify.error);
  }, [ownerInstituteId, notify]);
  const options =
    loaded.ownerInstituteId === ownerInstituteId ? loaded : { roles: [], departments: [] };
  return (
    <>
      <FormSelect
        name="roleId"
        label="Role"
        options={options.roles}
        helperText="Need another role? Add it on the Roles page, then it shows here."
        rules={{ required: 'Choose a role' }}
      />
      <FormSelect
        name="departmentIds"
        label="Departments (for clearance)"
        options={options.departments}
        multiple
        helperText="Only for department in-charges: the clearance queues they act on"
      />
    </>
  );
}

const NEW_INVITE = {
  ownerInstituteId: '', // an institute of the owner; the Super Admin chooses it in "All institutes"
  name: '',
  email: '',
  mobile: '',
  roleId: '',
  departmentIds: [],
};

export default function UsersPage() {
  const notify = useNotify();
  const {
    selectedInstitute,
    isSuperAdmin,
    user: me,
    allInstitutes,
    realInstitutes,
    owners,
  } = useAuth();
  const list = useList(usersApi.list, { sort: 'name' });
  const inviteRequest = useRequest(usersApi.invite);
  const accessRequest = useRequest(usersApi.setAccess);
  const removeRequest = useRequest(usersApi.removeAccess);

  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [link, setLink] = useState(null); // { title, link, expiresAt }

  const owner = selectedInstitute?.unit?.name ?? selectedInstitute?.name ?? 'this institute';
  const isMe = (user) => String(user.userId) === String(me?.id);
  // Every change goes to the row's own institute / unit. A Super Admin row has none: any works.
  const target = (user) => user.ownerInstituteId ?? realInstitutes[0]?.id;
  const ownerOf = (user) => (allInstitutes ? user.ownerName : owner);
  const manageable = (user) => !isMe(user) && (!user.isSuperAdmin || isSuperAdmin);

  const handleInvite = async ({ ownerInstituteId, ...values }) => {
    const result = await inviteRequest.run(values, ownerInstituteId);
    const invitedTo = allInstitutes
      ? owners.find((o) => o.value === ownerInstituteId)?.label
      : owner;
    setInviting(false);
    list.reload();
    if (result.inviteLink) {
      setLink({
        title: `Invite link for ${values.name}`,
        link: result.inviteLink,
        expiresAt: result.expiresAt,
      });
    } else {
      notify.success(`${values.email} already has an account and can now open ${invitedTo}`);
    }
  };

  const handleAccess = async ({ ownerInstituteId, ...values }) => {
    await accessRequest.run(editing.userId, values, ownerInstituteId);
    notify.success('Role changed');
    setEditing(null);
    list.reload();
  };

  // Small one-click actions: errors become toasts
  const act = (fn, success) => async (user) => {
    try {
      const result = await fn(user.userId, target(user));
      if (success) notify.success(success);
      list.reload();
      return result;
    } catch (error) {
      notify.error(error);
      return null;
    }
  };

  const makeLink = async (user) => {
    const result = await act(usersApi.setupLink)(user);
    if (result) {
      const kind = user.status === USER_STATUSES.INVITED ? 'Invite' : 'Password reset';
      setLink({ title: `${kind} link for ${user.name}`, ...result });
    }
  };

  const handleRemove = async () => {
    try {
      await removeRequest.run(removing.userId, target(removing));
      notify.success(`${removing.name} no longer has access to ${ownerOf(removing)}`);
      setRemoving(null);
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const rowActions = [
    {
      label: 'Change role',
      icon: EditOutlinedIcon,
      onClick: setEditing,
      show: (u) => manageable(u) && !u.isSuperAdmin,
    },
    {
      label: 'Invite or password link',
      icon: LinkOutlinedIcon,
      onClick: makeLink,
      show: (u) => manageable(u) && u.status !== USER_STATUSES.DISABLED,
    },
    {
      label: 'Remove access',
      icon: PersonRemoveOutlinedIcon,
      onClick: setRemoving,
      color: 'error',
      show: (u) => manageable(u) && !u.isSuperAdmin && u.roleId,
    },
    ...(isSuperAdmin
      ? [
          {
            label: 'Disable account',
            icon: BlockOutlinedIcon,
            onClick: act(usersApi.disable, 'Account disabled'),
            color: 'error',
            show: (u) => manageable(u) && u.status !== USER_STATUSES.DISABLED,
          },
          {
            label: 'Enable account',
            icon: CheckCircleOutlinedIcon,
            onClick: act(usersApi.enable, 'Account enabled'),
            show: (u) => manageable(u) && u.status === USER_STATUSES.DISABLED,
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Users"
        subtitle={allInstitutes ? 'Everyone in the organisation' : `Staff of ${owner}`}
        actions={
          <Button
            variant="contained"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={() => setInviting(true)}
          >
            Invite user
          </Button>
        }
      />

      <DataTable
        columns={
          allInstitutes
            ? [ownerColumn, ...columns]
            : selectedInstitute?.unit
              ? [...columns.slice(0, 3), canOpenColumn, ...columns.slice(3)]
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
        rowActions={rowActions}
        searchPlaceholder="Name or email"
        emptyText="No users yet"
      />

      <FormDialog
        open={inviting}
        title={allInstitutes ? 'Invite a user' : `Invite a user to ${owner}`}
        defaultValues={{
          ...NEW_INVITE,
          ownerInstituteId: allInstitutes ? '' : selectedInstitute?.id,
        }}
        submitLabel="Create invite link"
        loading={inviteRequest.loading}
        onSubmit={handleInvite}
        onClose={() => setInviting(false)}
      >
        {allInstitutes && (
          <FormSelect
            name="ownerInstituteId"
            label="Institute / unit"
            options={owners}
            helperText="Staff of a unit can open every institute in it"
            rules={{ required: 'Choose where this person works' }}
          />
        )}
        <FormTextField name="name" label="Full name" rules={{ required: 'Enter the name' }} />
        <FormTextField
          name="email"
          label="Email"
          type="email"
          rules={{
            required: 'Enter the email',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          }}
        />
        <FormTextField
          name="mobile"
          label="Mobile (optional)"
          slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 10 } }}
          rules={{
            pattern: { value: /^([6-9]\d{9})?$/, message: 'Enter a 10-digit mobile number' },
          }}
        />
        <AccessFields />
      </FormDialog>

      <FormDialog
        open={Boolean(editing)}
        title={`Change role: ${editing?.name ?? ''}${allInstitutes && editing ? ` (${editing.ownerName})` : ''}`}
        defaultValues={{
          ownerInstituteId: editing ? target(editing) : '',
          roleId: editing?.roleId ?? '',
          departmentIds: editing?.departmentIds ?? [],
        }}
        submitLabel="Save"
        loading={accessRequest.loading}
        onSubmit={handleAccess}
        onClose={() => setEditing(null)}
      >
        <AccessFields />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove access?"
        message={
          removing
            ? `${removing.name} will no longer be able to open ${ownerOf(removing)}. The account itself stays.`
            : ''
        }
        confirmLabel="Remove access"
        danger
        loading={removeRequest.loading}
        onConfirm={handleRemove}
        onClose={() => setRemoving(null)}
      />

      <CopyLinkDialog
        open={Boolean(link)}
        title={link?.title}
        link={link?.link}
        expiresAt={link?.expiresAt}
        onClose={() => setLink(null)}
      />
    </>
  );
}
