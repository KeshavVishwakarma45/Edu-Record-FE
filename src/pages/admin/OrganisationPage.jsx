import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';
import MergeTypeOutlinedIcon from '@mui/icons-material/MergeTypeOutlined';
import CallSplitOutlinedIcon from '@mui/icons-material/CallSplitOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import AddLinkOutlinedIcon from '@mui/icons-material/AddLinkOutlined';
import DriveFileRenameOutlineOutlinedIcon from '@mui/icons-material/DriveFileRenameOutlineOutlined';
import { organisationApi } from '@/api/organisation';
import PageHeader from '@/components/PageHeader';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import InstituteBadge from '@/components/InstituteBadge';
import FormTextField from '@/components/form/FormTextField';
import { useAuth } from '@/hooks/useAuth';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';
import InstituteDialog from './organisation/InstituteDialog';
import CombineDialog from './organisation/CombineDialog';
import JoinUnitDialog from './organisation/JoinUnitDialog';

// Super Admin only (ADR-016). Here the Super Admin adds and edits institutes, combines them into
// units (shared roles and staff), adds or takes out one institute, renames and separates units.
// Records (students, documents, TCs, numbering) always stay with their own institute.

function Stat({ label, value }) {
  return (
    <Typography sx={{ color: 'text.secondary' }}>
      {label}: <b>{value}</b>
    </Typography>
  );
}

function IconAction({ label, icon: Icon, onClick, color }) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} size="small" color={color} onClick={onClick}>
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

// Empty choices are sent as "not given" so the server does not read '' as a value
function toInstitutePayload({ universityId, affiliatedFrom, unitId, ...rest }) {
  return {
    ...rest,
    ...(universityId ? { universityId, affiliatedFrom: Number(affiliatedFrom) } : {}),
    ...(unitId ? { unitId } : {}),
  };
}

export default function OrganisationPage() {
  const notify = useNotify();
  const { reloadAccess } = useAuth();
  const [overview, setOverview] = useState({ data: null, error: null });
  const [reloadCount, setReloadCount] = useState(0);

  // Which dialog is open
  const [instituteDialog, setInstituteDialog] = useState(null); // { institute? }
  const [combining, setCombining] = useState(false);
  const [joining, setJoining] = useState(null); // { unit?, institute? }
  const [renaming, setRenaming] = useState(null); // unit
  const [removing, setRemoving] = useState(null); // { unit, institute }
  const [separating, setSeparating] = useState(null); // unit
  const [preview, setPreview] = useState(null);

  const createRequest = useRequest(organisationApi.createInstitute);
  const updateRequest = useRequest(organisationApi.updateInstitute);
  const previewCombineRequest = useRequest(organisationApi.previewCombine);
  const combineRequest = useRequest(organisationApi.combine);
  const previewJoinRequest = useRequest(organisationApi.previewJoin);
  const joinRequest = useRequest(organisationApi.join);
  const renameRequest = useRequest(organisationApi.renameUnit);
  const removeRequest = useRequest(organisationApi.removeInstitute);
  const separateRequest = useRequest(organisationApi.separate);

  // Loads the overview again whenever reloadCount changes (after a change, or Retry)
  useEffect(() => {
    let ignore = false;
    organisationApi
      .overview()
      .then((data) => !ignore && setOverview({ data, error: null }))
      .catch((error) => !ignore && setOverview({ data: null, error }));
    return () => {
      ignore = true;
    };
  }, [reloadCount]);
  const { data, error } = overview;

  // After every change: reload this page and the user's institute list (top-bar switcher)
  const refresh = async (message) => {
    notify.success(message);
    setReloadCount((count) => count + 1);
    await reloadAccess();
  };
  const clearPreview = useCallback(() => setPreview(null), []);

  // ---- Actions ----
  const saveInstitute = async (values) => {
    const editing = instituteDialog.institute;
    if (editing) {
      await updateRequest.run(editing.id, values);
    } else {
      await createRequest.run(toInstitutePayload(values));
    }
    setInstituteDialog(null);
    await refresh(editing ? 'Institute updated' : `${values.shortCode.toUpperCase()} added`);
  };

  // First press shows the preview; the second press (after checking it) does it
  const combine = async (values) => {
    if (!preview) {
      setPreview(await previewCombineRequest.run(values));
      return;
    }
    await combineRequest.run(values);
    setCombining(false);
    setPreview(null);
    await refresh(`Combined into "${values.name}"`);
  };

  const join = async (values) => {
    if (!preview) {
      setPreview(await previewJoinRequest.run(values.unitId, values.instituteId));
      return;
    }
    await joinRequest.run(values.unitId, values.instituteId);
    setJoining(null);
    setPreview(null);
    await refresh('Institute added to the unit');
  };

  const rename = async ({ name }) => {
    await renameRequest.run(renaming.id, name);
    setRenaming(null);
    await refresh('Unit renamed');
  };

  // For the confirm dialogs: run, close, refresh; errors become a toast
  const confirm = (run, close, message) => async () => {
    try {
      await run();
      close();
      await refresh(message);
    } catch (actionError) {
      notify.error(actionError);
    }
  };

  // ---- Page ----
  const institutes = data?.institutes ?? [];
  const units = data?.units ?? [];
  const instituteById = new Map(institutes.map((i) => [String(i.id), i]));
  const separateInstitutes = institutes.filter((i) => !i.unitId);

  let body;
  if (error) {
    body = <ErrorState error={error} onRetry={() => setReloadCount((count) => count + 1)} />;
  } else if (!data) {
    body = <Skeleton variant="rounded" height={160} />;
  } else if (institutes.length === 0) {
    body = <EmptyState title="No institutes yet" description="Add the first institute." />;
  } else {
    body = (
      <Box
        sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}
      >
        {units.map((unit) => (
          <Card key={unit.id}>
            <CardContent>
              <Typography sx={{ color: 'text.secondary' }}>Combined unit</Typography>
              <Typography variant="h6" component="h2">
                {unit.name}
              </Typography>
              <Stat label="Shared roles" value={unit.roleCount} />
              <Stat label="Shared staff" value={unit.userCount} />
              <Divider sx={{ my: 1.5 }} />
              {unit.instituteIds.map((id) => {
                const institute = instituteById.get(String(id));
                if (!institute) return null;
                return (
                  <Stack
                    key={id}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', py: 0.5 }}
                  >
                    <InstituteBadge shortCode={institute.shortCode} />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography noWrap>{institute.name}</Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                        {[
                          institute.universities.join(', '),
                          `Roles used: ${institute.roleCount} of ${unit.roles.length}`,
                          `Staff: ${institute.userCount}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    </Box>
                    <IconAction
                      label={`Edit ${institute.shortCode}`}
                      icon={EditOutlinedIcon}
                      onClick={() => setInstituteDialog({ institute })}
                    />
                    <IconAction
                      label={`Take ${institute.shortCode} out of the unit`}
                      icon={LogoutOutlinedIcon}
                      color="error"
                      onClick={() => setRemoving({ unit, institute })}
                    />
                  </Stack>
                );
              })}
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Button
                startIcon={<DriveFileRenameOutlineOutlinedIcon />}
                onClick={() => setRenaming(unit)}
              >
                Rename
              </Button>
              {separateInstitutes.length > 0 && (
                <Button startIcon={<AddLinkOutlinedIcon />} onClick={() => setJoining({ unit })}>
                  Add institute
                </Button>
              )}
              <Button startIcon={<CallSplitOutlinedIcon />} onClick={() => setSeparating(unit)}>
                Separate all
              </Button>
            </CardActions>
          </Card>
        ))}
        {separateInstitutes.map((institute) => (
          <Card key={institute.id}>
            <CardContent>
              <Typography sx={{ color: 'text.secondary' }}>Separate institute</Typography>
              <Typography variant="h6" component="h2">
                {institute.name}
              </Typography>
              <Box sx={{ my: 1.5 }}>
                <InstituteBadge shortCode={institute.shortCode} />
              </Box>
              {institute.universities.length > 0 && (
                <Stat label="University" value={institute.universities.join(', ')} />
              )}
              <Stat label="Own roles" value={institute.roleCount} />
              <Stat label="Own staff" value={institute.userCount} />
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Button
                startIcon={<EditOutlinedIcon />}
                onClick={() => setInstituteDialog({ institute })}
              >
                Edit
              </Button>
              {units.length > 0 && (
                <Button
                  startIcon={<AddLinkOutlinedIcon />}
                  onClick={() => setJoining({ institute })}
                >
                  Add to a unit
                </Button>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Organisation"
        subtitle="Institutes, and how they share roles and staff"
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<MergeTypeOutlinedIcon />}
              disabled={separateInstitutes.length < 2}
              onClick={() => setCombining(true)}
            >
              Combine
            </Button>
            <Button
              variant="contained"
              startIcon={<AddBusinessOutlinedIcon />}
              onClick={() => setInstituteDialog({})}
            >
              Add institute
            </Button>
          </>
        }
      />
      <Alert severity="info" sx={{ mb: 2 }}>
        A <b>separate</b> institute has its own roles and staff. Institutes <b>combined</b> in a
        unit share one role list and staff; edit an institute to choose which of the unit&apos;s
        roles it uses. Records (students, documents, TCs, TC numbers) always stay with their own
        institute. The Roles and Users pages work on the institute selected in the top bar.
      </Alert>
      {body}

      <InstituteDialog
        open={Boolean(instituteDialog)}
        institute={instituteDialog?.institute}
        unitRoles={
          units.find((u) => String(u.id) === String(instituteDialog?.institute?.unitId))?.roles
        }
        units={units}
        loading={createRequest.loading || updateRequest.loading}
        onSubmit={saveInstitute}
        onClose={() => setInstituteDialog(null)}
      />

      <CombineDialog
        open={combining}
        separateInstitutes={separateInstitutes}
        preview={preview}
        loading={previewCombineRequest.loading || combineRequest.loading}
        onSubmit={combine}
        onEdit={clearPreview}
        onClose={() => {
          setCombining(false);
          setPreview(null);
        }}
      />

      <JoinUnitDialog
        open={Boolean(joining)}
        fixed={joining ?? {}}
        units={units}
        separateInstitutes={separateInstitutes}
        preview={preview}
        loading={previewJoinRequest.loading || joinRequest.loading}
        onSubmit={join}
        onEdit={clearPreview}
        onClose={() => {
          setJoining(null);
          setPreview(null);
        }}
      />

      <FormDialog
        open={Boolean(renaming)}
        title="Rename unit"
        defaultValues={{ name: renaming?.name ?? '' }}
        submitLabel="Rename"
        loading={renameRequest.loading}
        onSubmit={rename}
        onClose={() => setRenaming(null)}
      >
        <FormTextField name="name" label="Unit name" rules={{ required: 'Enter a name' }} />
      </FormDialog>

      <ConfirmDialog
        open={Boolean(removing)}
        title={`Take ${removing?.institute.shortCode ?? ''} out of the unit?`}
        message={
          removing
            ? removing.unit.instituteIds.length <= 2
              ? `"${removing.unit.name}" would have only one institute left, so the whole unit will be separated: every institute gets its own copy of the roles and every user keeps their role.`
              : `${removing.institute.shortCode} gets its own copy of the unit's ${removing.unit.roleCount} roles. Unit staff keep access to it with the same role. The other institutes stay in "${removing.unit.name}".`
            : ''
        }
        confirmLabel="Take out"
        danger
        loading={removeRequest.loading}
        onConfirm={confirm(
          () => removeRequest.run(removing.unit.id, removing.institute.id),
          () => setRemoving(null),
          'Institute taken out of the unit',
        )}
        onClose={() => setRemoving(null)}
      />

      <ConfirmDialog
        open={Boolean(separating)}
        title="Separate this unit?"
        message={
          separating
            ? `Each institute of "${separating.name}" gets its own copy of the ${separating.roleCount} roles, and every user keeps the same role in each institute. You can then change roles per institute.`
            : ''
        }
        confirmLabel="Separate"
        loading={separateRequest.loading}
        onConfirm={confirm(
          () => separateRequest.run(separating.id),
          () => setSeparating(null),
          `"${separating?.name}" separated: each institute now has its own roles`,
        )}
        onClose={() => setSeparating(null)}
      />
    </>
  );
}
