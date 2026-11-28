import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { rolesApi } from '@/api/roles';
import { PERMISSION_GROUPS, PERMISSION_LIST } from '@/constants/permissions';
import { OWNER_TYPES } from '@/constants/ownerTypes';
import PageHeader from '@/components/PageHeader';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { useList } from '@/hooks/useList';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

const EMPTY_FORM = {
  ownerInstituteId: '',
  name: '',
  description: '',
  permissions: [],
  instituteIds: [],
};

export default function RolesPage() {
  const notify = useNotify();

  const { selectedInstitute, permissions, isSuperAdmin, allInstitutes, owners, realInstitutes } =
    useAuth();

  const list = useList(rolesApi.list, {
    sort: 'name',
    limit: 100,
  });

  const createRequest = useRequest(rolesApi.create);
  const updateRequest = useRequest(rolesApi.update);
  const removeRequest = useRequest(rolesApi.remove);

  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formState, setFormState] = useState(EMPTY_FORM);
  const [formDirty, setFormDirty] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [template, setTemplate] = useState('');

  const saving = createRequest.loading || updateRequest.loading;

  const grantable = useMemo(
    () => (isSuperAdmin ? PERMISSION_LIST : permissions),
    [isSuperAdmin, permissions],
  );

  const groups = useMemo(
    () =>
      isSuperAdmin
        ? PERMISSION_GROUPS
        : PERMISSION_GROUPS.map((group) => ({
            ...group,
            permissions: group.permissions.filter((item) => grantable.includes(item.value)),
          })).filter((group) => group.permissions.length > 0),
    [isSuperAdmin, grantable],
  );

  const membersOf = (instituteId) => {
    const institute = realInstitutes.find((item) => String(item.id) === String(instituteId));

    const unitId = institute?.unit?.id;

    if (!unitId) return [];

    return realInstitutes.filter((item) => String(item.unit?.id) === String(unitId));
  };

  const formValues = (role) => ({
    ownerInstituteId: role.ownerInstituteId ?? '',
    name: role.name ?? '',
    description: role.description ?? '',
    permissions: role.permissions ?? [],
    instituteIds:
      role.instituteIds?.length > 0
        ? role.instituteIds.map(String)
        : membersOf(role.ownerInstituteId).map((item) => String(item.id)),
  });

  const tabs = useMemo(() => {
    if (!allInstitutes) return [];

    const instituteTabs = realInstitutes.map((institute) => ({
      id: `institute-${institute.id}`,
      label: institute.shortCode,
      description: institute.name,
      instituteId: String(institute.id),
      type: OWNER_TYPES.INSTITUTE,
    }));

    const units = [
      ...new Map(
        realInstitutes
          .filter((item) => item.unit?.id)
          .map((item) => [String(item.unit.id), item.unit]),
      ).values(),
    ];

    const unitTabs = units.map((unit) => ({
      id: `unit-${unit.id}`,
      label: unit.name,
      description: 'Shared unit roles',
      unitId: String(unit.id),
      type: OWNER_TYPES.UNIT,
    }));

    return [
      ...instituteTabs,
      ...(unitTabs.length > 0
        ? unitTabs
        : [
            {
              id: 'unit-not-set',
              label: 'Unit · not set up',
              description: 'Institutes can be combined into a unit',
              type: OWNER_TYPES.UNIT,
              disabled: true,
            },
          ]),
    ];
  }, [allInstitutes, realInstitutes]);

  const currentTab = tabs.find((item) => item.id === activeTab);

  const visibleRoles = useMemo(() => {
    if (!allInstitutes || activeTab === 'all') {
      return list.rows;
    }

    if (!currentTab) return list.rows;

    if (currentTab.type === OWNER_TYPES.UNIT) {
      if (!currentTab.unitId) return [];

      return list.rows.filter((role) => {
        if (role.ownerType !== OWNER_TYPES.UNIT) return false;

        const owner = realInstitutes.find(
          (item) => String(item.id) === String(role.ownerInstituteId),
        );

        return String(owner?.unit?.id) === currentTab.unitId;
      });
    }

    return list.rows.filter((role) => {
      const belongsToInstitute = String(role.ownerInstituteId) === currentTab.instituteId;

      const belongsThroughUnit = role.usedIn?.includes(currentTab.label);

      return belongsToInstitute || belongsThroughUnit;
    });
  }, [allInstitutes, activeTab, currentTab, list.rows, realInstitutes]);

  // Derive the selected role from the latest list data.
  // If the selected role is unavailable, fall back to the first visible role.
  const selectedRole = isCreating
    ? null
    : (visibleRoles.find((role) => role._id === selectedRoleId) ?? visibleRoles[0] ?? null);

  // Derive the saved form from the selected role until the user edits it.
  const form = !isCreating && !formDirty && selectedRole ? formValues(selectedRole) : formState;

  // Mark the form as edited whenever a form interaction updates it.
  const setForm = (updater) => {
    setFormState(updater);
    setFormDirty(true);
  };

  useEffect(() => {
    if (!isCreating) return;

    rolesApi.templates().then(setTemplates).catch(notify.error);
  }, [isCreating, notify]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectRole = (role) => {
    setIsCreating(false);
    setSelectedRoleId(role._id);
    setFormState(formValues(role));
    setFormDirty(false);
    setTemplate('');
  };

  const startNewRole = () => {
    setSelectedRoleId(null);
    setIsCreating(true);
    setTemplate('');
    setFormDirty(false);

    setFormState({
      ...EMPTY_FORM,
      ownerInstituteId: allInstitutes ? '' : String(selectedInstitute?.id ?? ''),
    });
  };

  const cancelEditing = () => {
    setIsCreating(false);
    setTemplate('');
    setFormDirty(false);

    if (selectedRole) {
      setFormState(formValues(selectedRole));
    } else {
      setFormState(EMPTY_FORM);
    }
  };

  const handleTemplateChange = (value) => {
    setTemplate(value);

    const chosen = templates.find((item) => item.name === value);

    if (!chosen) return;

    setForm((previous) => ({
      ...previous,
      name: chosen.name,
      description: chosen.description,
      permissions: chosen.permissions.filter((item) => grantable.includes(item)),
    }));
  };

  const handlePermissionChange = (permission, checked) => {
    setForm((previous) => ({
      ...previous,
      permissions: checked
        ? [...new Set([...previous.permissions, permission])]
        : previous.permissions.filter((item) => item !== permission),
    }));
  };

  const handleInstituteChange = (instituteId, checked) => {
    setForm((previous) => ({
      ...previous,
      instituteIds: checked
        ? [...new Set([...previous.instituteIds, instituteId])]
        : previous.instituteIds.filter((id) => id !== instituteId),
    }));
  };

  const handleOwnerChange = (ownerInstituteId) => {
    const members = membersOf(ownerInstituteId);

    setForm((previous) => ({
      ...previous,
      ownerInstituteId,
      instituteIds: members.map((item) => String(item.id)),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      notify.error('Enter the role name');
      return;
    }

    if (form.name.trim().length < 2) {
      notify.error('Role name must contain at least 2 characters');
      return;
    }

    if (form.permissions.length === 0) {
      notify.error('Select at least one permission');
      return;
    }

    if (allInstitutes && isCreating && !form.ownerInstituteId) {
      notify.error('Choose an institute or unit');
      return;
    }

    const members = membersOf(form.ownerInstituteId);

    if (members.length > 1 && form.instituteIds.length === 0) {
      notify.error('Select at least one institute under Used in');
      return;
    }

    const values = {
      name: form.name.trim(),
      description: form.description.trim(),
      permissions: form.permissions,
    };

    const data = members.length > 1 ? { ...values, instituteIds: form.instituteIds } : values;

    try {
      if (isCreating) {
        await createRequest.run(data, form.ownerInstituteId);
        notify.success('Role added successfully');
      } else if (selectedRole) {
        await updateRequest.run(selectedRole._id, data, selectedRole.ownerInstituteId);
        notify.success('Role updated successfully');
      }

      setIsCreating(false);
      setSelectedRoleId(null);
      setFormDirty(false);
      setTemplate('');
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    try {
      await removeRequest.run(deleting._id, deleting.ownerInstituteId);

      notify.success('Role deleted successfully');

      setDeleting(null);
      setSelectedRoleId(null);
      setFormDirty(false);
      list.reload();
    } catch (error) {
      notify.error(error);
    }
  };

  const selectedMembers = membersOf(form.ownerInstituteId);

  const ownerName = selectedInstitute?.unit?.name ?? selectedInstitute?.name ?? 'this institute';

  const selectedTabLabel = currentTab?.label ?? ownerName;

  return (
    <Box>
      <PageHeader
        title="Roles and permissions"
        subtitle="A role says what someone can do. Which institute they can do it in is set on each user."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              onClick={() => {
                if (selectedRole) {
                  selectRole(selectedRole);
                }
              }}
              disabled={!selectedRole || isCreating}
            >
              Edit role
            </Button>

            <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={startNewRole}>
              Add role
            </Button>
          </Stack>
        }
      />

      {allInstitutes && (
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            Roles of
          </Typography>

          {tabs.map((tab) => {
            const count =
              tab.type === OWNER_TYPES.UNIT
                ? list.rows.filter((role) => role.ownerType === OWNER_TYPES.UNIT).length
                : list.rows.filter(
                    (role) =>
                      String(role.ownerInstituteId) === tab.instituteId ||
                      role.usedIn?.includes(tab.label),
                  ).length;

            return (
              <Button
                key={tab.id}
                size="small"
                disabled={tab.disabled}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedRoleId(null);
                  setFormDirty(false);
                  setIsCreating(false);
                }}
                variant={activeTab === tab.id ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: 5,
                  minHeight: 34,
                  ...(activeTab === tab.id && {
                    backgroundColor: '#e9edff',
                    color: '#294dbb',
                    '&:hover': {
                      backgroundColor: '#dfe6ff',
                    },
                  }),
                }}
              >
                {tab.label}
                {!tab.disabled && ` · ${count} roles`}
              </Button>
            );
          })}
        </Box>
      )}

      {allInstitutes && currentTab?.type === OWNER_TYPES.INSTITUTE && (
        <Alert severity="info" sx={{ mb: 2 }}>
          These roles belong to {currentTab.label} only. Changes here do not affect other
          institutes. To share roles, combine the institutes into a unit.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '230px minmax(0, 1fr)',
          },
          gap: 1.5,
          alignItems: 'start',
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography fontWeight={700}>{allInstitutes ? selectedTabLabel : ownerName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {visibleRoles.length} roles
            </Typography>
          </Box>

          <Divider />

          {list.loading ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          ) : list.error ? (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="error"
                action={
                  <Button color="inherit" size="small" onClick={list.reload}>
                    Retry
                  </Button>
                }
              >
                Could not load roles.
              </Alert>
            </Box>
          ) : visibleRoles.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No roles found for this selection.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.5} sx={{ p: 0.75 }}>
              {visibleRoles.map((role) => (
                <Button
                  key={role._id}
                  onClick={() => selectRole(role)}
                  fullWidth
                  sx={{
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    px: 1.25,
                    py: 1.1,
                    borderRadius: 1.5,
                    color:
                      selectedRole?._id === role._id && !isCreating ? '#294dbb' : 'text.primary',
                    backgroundColor:
                      selectedRole?._id === role._id && !isCreating ? '#eef1ff' : 'transparent',
                    '&:hover': {
                      backgroundColor: '#f3f5ff',
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'none' }}>
                    {role.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flexShrink: 0, ml: 1 }}
                  >
                    {role.userCount ?? 0} users
                  </Typography>
                </Button>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 2,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {isCreating || selectedRole ? (
            <>
              <Box sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {allInstitutes && isCreating && (
                    <TextField
                      select
                      label="Institute / unit"
                      value={form.ownerInstituteId}
                      onChange={(event) => handleOwnerChange(event.target.value)}
                      sx={{ flex: 1 }}
                    >
                      {owners.map((owner) => (
                        <MenuItem key={owner.value} value={owner.value}>
                          {owner.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}

                  <TextField
                    label="Role name"
                    value={form.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    sx={{ flex: 1 }}
                    required
                  />

                  <TextField
                    label="What this role is for"
                    value={form.description}
                    onChange={(event) => updateField('description', event.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Stack>

                {isCreating && templates.length > 0 && (
                  <TextField
                    select
                    label="Start from a built-in role (optional)"
                    value={template}
                    onChange={(event) => handleTemplateChange(event.target.value)}
                    sx={{ mt: 2, maxWidth: 420 }}
                  >
                    <MenuItem value="">Start empty</MenuItem>
                    {templates.map((item) => (
                      <MenuItem key={item.name} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}

                {selectedMembers.length > 1 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                      Used in
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Staff with this role can open only the selected institutes.
                    </Typography>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                      {selectedMembers.map((member) => (
                        <FormControlLabel
                          key={member.id}
                          control={
                            <Checkbox
                              size="small"
                              checked={form.instituteIds.includes(String(member.id))}
                              onChange={(event) =>
                                handleInstituteChange(String(member.id), event.target.checked)
                              }
                            />
                          }
                          label={`${member.shortCode} · ${member.name}`}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>

              <Divider />

              <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                  Permissions
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select what this role is allowed to do. Only permissions available to you can be
                  assigned.
                </Typography>

                {groups.length === 0 ? (
                  <Alert severity="warning">
                    You do not have permission to assign any permissions.
                  </Alert>
                ) : (
                  <TableContainer
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1.5,
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f8f9fc' }}>
                          <TableCell width="30%">AREA</TableCell>
                          <TableCell>PERMISSION</TableCell>
                          <TableCell align="center" width={110}>
                            ALLOW
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {groups.map((group) =>
                          group.permissions.map((permission, index) => (
                            <TableRow key={permission.value} hover>
                              {index === 0 && (
                                <TableCell
                                  rowSpan={group.permissions.length}
                                  sx={{
                                    verticalAlign: 'top',
                                    fontWeight: 700,
                                    backgroundColor: '#fcfcfe',
                                  }}
                                >
                                  {group.label}
                                </TableCell>
                              )}

                              <TableCell>{permission.label}</TableCell>

                              <TableCell align="center">
                                <Checkbox
                                  size="small"
                                  checked={form.permissions.includes(permission.value)}
                                  onChange={(event) =>
                                    handlePermissionChange(permission.value, event.target.checked)
                                  }
                                  inputProps={{
                                    'aria-label': permission.label,
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          )),
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              <Divider />

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
                justifyContent="space-between"
                sx={{ p: 2 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {isCreating ? 'New role' : `Used by ${selectedRole?.userCount ?? 0} user(s)`}
                  {' · '}
                  {form.permissions.length} permissions selected
                </Typography>

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  {!isCreating && selectedRole?.userCount === 0 && (
                    <Button
                      color="error"
                      variant="outlined"
                      startIcon={<DeleteOutlinedIcon />}
                      onClick={() => setDeleting(selectedRole)}
                    >
                      Delete
                    </Button>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<CloseOutlinedIcon />}
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : isCreating ? 'Add role' : 'Save role'}
                  </Button>
                </Stack>
              </Stack>
            </>
          ) : (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700}>
                Select a role
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Choose a role from the list or add a new role.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddOutlinedIcon />}
                onClick={startNewRole}
                sx={{ mt: 2 }}
              >
                Add role
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

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
    </Box>
  );
}
