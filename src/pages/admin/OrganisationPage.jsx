import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';

import { organisationApi } from '@/api/organisation';
import PageHeader from '@/components/PageHeader';
import FormDialog from '@/components/FormDialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import ErrorState from '@/components/ErrorState';
import FormTextField from '@/components/form/FormTextField';
import { useAuth } from '@/hooks/useAuth';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

import InstituteDialog from './organisation/InstituteDialog';
import CombineDialog from './organisation/CombineDialog';
import JoinUnitDialog from './organisation/JoinUnitDialog';
import DepartmentsDialog from './organisation/DepartmentsDialog';

function IconAction({ label, icon: Icon, onClick, color }) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} size="small" color={color} onClick={onClick}>
        <Icon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}

function Metric({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={750} lineHeight={1.4} sx={{ mt: 0.25 }}>
        {value ?? 0}
      </Typography>
    </Box>
  );
}

function InstituteLogo({ institute }) {
  const [loadedLogo, setLoadedLogo] = useState({
    key: '',
    src: '',
  });

  const logoKey = institute.logo && institute.id ? `${institute.id}:${institute.logo}` : '';

  useEffect(() => {
    if (!logoKey) return undefined;

    let active = true;
    let objectUrl = '';

    organisationApi
      .getFile(institute.logo, institute.id)
      .then((blob) => {
        if (!active) return;

        objectUrl = URL.createObjectURL(blob);

        setLoadedLogo({
          key: logoKey,
          src: objectUrl,
        });
      })
      .catch(() => {
        if (active) {
          setLoadedLogo({
            key: logoKey,
            src: '',
          });
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [institute.id, institute.logo, logoKey]);

  const src = loadedLogo.key === logoKey ? loadedLogo.src : '';

  return (
    <Avatar
      variant="rounded"
      src={src || undefined}
      sx={{
        width: 46,
        height: 46,
        flexShrink: 0,
        bgcolor: 'grey.100',
        color: 'text.secondary',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '& img': {
          objectFit: 'contain',
          p: 0.5,
        },
      }}
    >
      <ApartmentOutlinedIcon />
    </Avatar>
  );
}

function InstituteCard({
  institute,
  unit,
  onEdit,
  onDepartments,
  onJoin,
  onRemove,
  onRoles,
  onUsers,
  onOpen,
}) {
  const isInUnit = Boolean(institute.unitId);
  const affiliation = institute.affiliations?.[0];

  const codeColor =
    institute.shortCode === 'SSISM'
      ? { bg: '#fff0e8', color: '#a64e20' }
      : { bg: '#e9edff', color: '#3456b4' };

  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        borderRadius: 3,
        borderColor: 'divider',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent
        sx={{
          p: 2.5,
          flex: 1,
          '&:last-child': { pb: 2 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1.75 }}
        >
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={institute.shortCode || 'Institute'}
              sx={{
                fontWeight: 800,
                bgcolor: codeColor.bg,
                color: codeColor.color,
                borderRadius: 1.5,
              }}
            />

            <Chip
              size="small"
              variant="outlined"
              label={isInUnit ? unit?.name || 'Shared roles' : 'Own roles · separate'}
              sx={{
                borderRadius: 5,
                fontWeight: 600,
                maxWidth: 230,
              }}
            />
          </Stack>

          <IconAction
            label={`Edit ${institute.shortCode || 'institute'}`}
            icon={EditOutlinedIcon}
            onClick={onEdit}
          />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <InstituteLogo institute={institute} />

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              lineHeight={1.4}
              sx={{ overflowWrap: 'anywhere' }}
            >
              {institute.name}
            </Typography>

            {institute.address && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, overflowWrap: 'anywhere' }}
              >
                {institute.address}
              </Typography>
            )}

            {affiliation?.universityName && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {affiliation.universityName}
                {institute.courses?.length ? ` · ${institute.courses.join(', ')}` : ''}
              </Typography>
            )}
          </Box>
        </Stack>

        <Divider sx={{ my: 1.75 }} />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 1.5,
          }}
        >
          <Metric label="Roles" value={institute.roleCount} />
          <Metric label="Users" value={institute.userCount} />
          <Metric label="Students" value={institute.studentCount} />
        </Box>

        <Divider sx={{ my: 1.75 }} />

        <Stack direction="row" alignItems="center" spacing={1.25}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: codeColor.bg,
              color: codeColor.color,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            {(institute.adminName || institute.principalName || 'SA').slice(0, 2).toUpperCase()}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600}>
              {institute.adminName || `${institute.shortCode || 'Institute'} Institute Admin`}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {institute.adminName
                ? 'Institute administrator'
                : `Manages ${institute.shortCode || 'institute'} users and roles only`}
            </Typography>
          </Box>
        </Stack>

        {(institute.principalName || affiliation || institute.departments?.length > 0) && (
          <Stack spacing={0.4} sx={{ mt: 1.5 }}>
            {institute.principalName && (
              <Typography variant="caption" color="text.secondary">
                Principal: {institute.principalName}
              </Typography>
            )}

            {affiliation && (
              <Typography variant="caption" color="text.secondary">
                Affiliation: {affiliation.fromYear || '—'} – {affiliation.toYear || 'Present'}
              </Typography>
            )}

            {Array.isArray(institute.departments) && (
              <Typography variant="caption" color="text.secondary">
                Departments: {institute.departments.length}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>

      <Box
        sx={{
          px: 2.5,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={onRoles}
          sx={{
            borderRadius: 5,
            px: 1.75,
            color: 'text.primary',
            borderColor: 'divider',
          }}
        >
          Roles
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={onUsers}
          sx={{
            borderRadius: 5,
            px: 1.75,
            color: 'text.primary',
            borderColor: 'divider',
          }}
        >
          Users
        </Button>

        <Button
          size="small"
          variant="outlined"
          onClick={onOpen}
          sx={{
            borderRadius: 5,
            px: 1.75,
            color: 'text.primary',
            borderColor: 'divider',
          }}
        >
          Open {institute.shortCode || 'Institute'}
        </Button>

        <Button
          size="small"
          variant="text"
          onClick={onDepartments}
          sx={{ borderRadius: 5, px: 1, fontWeight: 600 }}
        >
          Departments
        </Button>

        {onJoin && (
          <Button size="small" variant="text" startIcon={<AddLinkOutlinedIcon />} onClick={onJoin}>
            Add to unit
          </Button>
        )}

        {isInUnit && onRemove && (
          <Tooltip title="Remove institute from unit">
            <IconButton
              size="small"
              color="error"
              aria-label="Remove institute from unit"
              onClick={onRemove}
            >
              <LogoutOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
}

function toInstitutePayload(values, editing) {
  const {
    logoFile,
    principalSignatureFile,
    removeLogo,
    removePrincipalSignature,
    universityId,
    affiliatedFrom,
    affiliatedTo,
    unitId,
    ...rest
  } = values;

  const payload = { ...rest };

  if (universityId) {
    payload.universityId = universityId;
    payload.affiliatedFrom = Number(affiliatedFrom);
    payload.affiliatedTo =
      affiliatedTo === '' || affiliatedTo === null || affiliatedTo === undefined
        ? null
        : Number(affiliatedTo);
  } else if (editing) {
    payload.universityId = '';
  }

  if (unitId) {
    payload.unitId = unitId;
  }

  return payload;
}

export default function OrganisationPage() {
  const notify = useNotify();
  const { reloadAccess } = useAuth();

  const [overview, setOverview] = useState({
    data: null,
    error: null,
  });

  const [reloadCount, setReloadCount] = useState(0);

  const [instituteDialog, setInstituteDialog] = useState(null);
  const [combining, setCombining] = useState(false);
  const [joining, setJoining] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [separating, setSeparating] = useState(null);
  const [departmentInstitute, setDepartmentInstitute] = useState(null);
  const [preview, setPreview] = useState(null);
  const [pendingAction, setPendingAction] = useState('');

  const createRequest = useRequest(organisationApi.createInstitute);
  const updateRequest = useRequest(organisationApi.updateInstitute);
  const previewCombineRequest = useRequest(organisationApi.previewCombine);
  const combineRequest = useRequest(organisationApi.combine);
  const previewJoinRequest = useRequest(organisationApi.previewJoin);
  const joinRequest = useRequest(organisationApi.join);
  const renameRequest = useRequest(organisationApi.renameUnit);
  const removeRequest = useRequest(organisationApi.removeInstitute);
  const separateRequest = useRequest(organisationApi.separate);

  useEffect(() => {
    let ignore = false;

    organisationApi
      .overview()
      .then((data) => {
        if (!ignore) {
          setOverview({ data, error: null });
        }
      })
      .catch((error) => {
        if (!ignore) {
          setOverview({ data: null, error });
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadCount]);

  const data = overview.data;
  const error = overview.error;

  const institutes = data?.institutes ?? [];
  const units = data?.units ?? [];

  const separateInstitutes = institutes.filter((institute) => !institute.unitId);

  const refresh = async (message) => {
    notify.success(message);
    setReloadCount((count) => count + 1);
    await reloadAccess();
  };

  const clearPreview = useCallback(() => {
    setPreview(null);
  }, []);

  const showPendingAction = (action, institute) => {
    setPendingAction(
      `${action} for ${institute?.shortCode || institute?.name || 'this institute'} needs the corresponding API/route integration.`,
    );
  };

  const saveInstitute = async (values) => {
    const editing = instituteDialog.institute;
    const payload = toInstitutePayload(values, Boolean(editing));

    let saved;

    if (editing) {
      saved = await updateRequest.run(editing.id, payload);
    } else {
      saved = await createRequest.run(payload);
    }

    const instituteId = editing?.id ?? saved?.id ?? saved?._id;

    const assetActions = [
      {
        asset: 'logo',
        file: values.logoFile,
        remove: values.removeLogo,
      },
      {
        asset: 'principalSignature',
        file: values.principalSignatureFile,
        remove: values.removePrincipalSignature,
      },
    ];

    if (instituteId) {
      for (const item of assetActions) {
        try {
          if (item.file) {
            await organisationApi.uploadInstituteAsset(instituteId, item.asset, item.file);
          } else if (item.remove) {
            await organisationApi.removeInstituteAsset(instituteId, item.asset);
          }
        } catch (assetError) {
          notify.error(assetError);
        }
      }
    }

    setInstituteDialog(null);

    await refresh(editing ? 'Institute updated' : `${values.shortCode.toUpperCase()} added`);
  };

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

  const confirm = (run, close, message) => async () => {
    try {
      await run();
      close();
      await refresh(message);
    } catch (actionError) {
      notify.error(actionError);
    }
  };

  let body;

  if (error) {
    body = <ErrorState error={error} onRetry={() => setReloadCount((count) => count + 1)} />;
  } else if (!data) {
    body = <Skeleton variant="rounded" height={360} />;
  } else if (institutes.length === 0) {
    body = (
      <EmptyState title="No institutes yet" description="Add the first institute to get started." />
    );
  } else {
    body = (
      <Stack spacing={2.5}>
        {/* Society and institute hierarchy */}
        <Card
          variant="outlined"
          sx={{
            p: { xs: 1.5, sm: 3 },
            borderRadius: 3,
            borderColor: 'divider',
            boxShadow: 'none',
            overflow: 'hidden',
          }}
        >
          {/* Society */}
          <Box
            sx={{
              maxWidth: 590,
              mx: 'auto',
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                px: 2,
                py: 2,
                width: '100%',
                maxWidth: 510,
                mx: 'auto',
                flexDirection: 'column',
                alignItems: 'center',
                bgcolor: '#f0f1ff',
                borderRadius: 3,
              }}
            >
              <Typography variant="overline" color="primary.dark" fontWeight={800} lineHeight={1.5}>
                SOCIETY · TOP LEVEL
              </Typography>

              <Typography variant="h6" fontWeight={800}>
                {data.societyName || 'Sant Singaji Educational Society'}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Super Admin · manages every institute, unit and role
              </Typography>
            </Box>
          </Box>

          {/* Society to institutes connector */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 22, md: 38 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                height: { xs: 22, md: 19 },
                borderLeft: '2px solid',
                borderColor: 'grey.400',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: { xs: 0, md: 19 },
                left: { xs: '50%', md: '25%' },
                right: { xs: '50%', md: '25%' },
                borderTop: { xs: 'none', md: '2px solid' },
                borderColor: 'grey.400',
              },
            }}
          />

          {/* Institute cards - rendered only once */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {institutes.map((institute) => {
              const unit = units.find((item) =>
                item.instituteIds?.some((id) => String(id) === String(institute.id)),
              );

              return (
                <Box
                  key={institute.id}
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -19,
                      left: '50%',
                      height: 19,
                      borderLeft: '2px solid',
                      borderColor: 'grey.400',
                      display: { xs: 'none', md: 'block' },
                    },
                  }}
                >
                  <InstituteCard
                    institute={institute}
                    unit={unit}
                    onEdit={() => setInstituteDialog({ institute })}
                    onDepartments={() => setDepartmentInstitute(institute)}
                    onJoin={
                      units.length > 0 && !institute.unitId ? () => setJoining({ institute }) : null
                    }
                    onRemove={
                      institute.unitId && unit ? () => setRemoving({ unit, institute }) : null
                    }
                    onRoles={() => showPendingAction('Roles', institute)}
                    onUsers={() => showPendingAction('Users', institute)}
                    onOpen={() => showPendingAction('Open Institute', institute)}
                  />
                </Box>
              );
            })}
          </Box>
        </Card>

        {/* Units */}
        <Card
          variant="outlined"
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 3,
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 52,
                height: 52,
                bgcolor: '#f0f1ff',
                color: 'primary.dark',
                borderRadius: 2,
              }}
            >
              <HubOutlinedIcon />
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography fontWeight={800}>Units</Typography>

              {units.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No unit yet —{' '}
                  {institutes
                    .map((item) => item.shortCode)
                    .filter(Boolean)
                    .join(' and ')}{' '}
                  each run their own roles. Combine them into a unit if you want one shared set of
                  roles. Records always stay separate per institute.
                </Typography>
              ) : (
                <Stack spacing={1} sx={{ mt: 0.75 }}>
                  {units.map((unit) => (
                    <Box
                      key={unit.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {unit.name}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {unit.instituteIds?.length ?? 0} institutes · {unit.roleCount ?? 0} shared
                          roles · {unit.userCount ?? 0} users
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={0.5}>
                        <IconAction
                          label="Rename unit"
                          icon={DriveFileRenameOutlineOutlinedIcon}
                          onClick={() => setRenaming(unit)}
                        />

                        <IconAction
                          label="Separate all institutes"
                          icon={CallSplitOutlinedIcon}
                          onClick={() => setSeparating(unit)}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Button
              variant="contained"
              onClick={() => setCombining(true)}
              disabled={separateInstitutes.length < 2}
              sx={{
                borderRadius: 5,
                px: 2.5,
                whiteSpace: 'nowrap',
                alignSelf: { xs: 'flex-start', sm: 'center' },
                bgcolor: '#f0f1ff',
                color: 'primary.dark',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#e4e7ff',
                  boxShadow: 'none',
                },
              }}
            >
              {units.length ? 'Set up another unit' : 'Set up a unit'}
            </Button>
          </Stack>
        </Card>

        {/* Admins - rendered only once */}
        <Card
          variant="outlined"
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography fontWeight={800}>Admins</Typography>

            <Button
              size="small"
              variant="outlined"
              onClick={() =>
                setPendingAction('Add admin needs the backend API and permission contract.')
              }
              sx={{
                borderRadius: 5,
                color: 'text.primary',
                borderColor: 'divider',
                px: 2,
              }}
            >
              Add admin
            </Button>
          </Box>

          <Divider />

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>NAME</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>MOBILE</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>LEVEL</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>CAN MANAGE</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {Array.isArray(data.admins) && data.admins.length > 0 ? (
                  data.admins.map((admin) => (
                    <TableRow key={admin.id || admin._id}>
                      <TableCell>{admin.name || '—'}</TableCell>
                      <TableCell>{admin.mobile || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={admin.level || admin.role || 'Admin'}
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>{admin.canManage || '—'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary" variant="body2" py={2}>
                        No admin records available from the server.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Stack>
    );
  }

  return (
    <>
      <PageHeader
        title="Organisations"
        subtitle="Each institute is a separate organisation with its own admin, roles, users and records. Only the Super Admin sees all of them."
        backTo="/"
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<MergeTypeOutlinedIcon />}
              disabled={separateInstitutes.length < 2}
              onClick={() => setCombining(true)}
            >
              Combine into a unit
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

      {pendingAction && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setPendingAction('')}>
          {pendingAction}
        </Alert>
      )}

      {body}

      {/* Add / Edit institute */}
      <InstituteDialog
        open={Boolean(instituteDialog)}
        institute={instituteDialog?.institute}
        unitRoles={
          units.find((unit) => String(unit.id) === String(instituteDialog?.institute?.unitId))
            ?.roles
        }
        units={units}
        loading={createRequest.loading || updateRequest.loading}
        onSubmit={saveInstitute}
        onClose={() => setInstituteDialog(null)}
      />

      {/* Department management */}
      <DepartmentsDialog
        open={Boolean(departmentInstitute)}
        institute={departmentInstitute}
        onClose={() => setDepartmentInstitute(null)}
      />

      {/* Combine institutes */}
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

      {/* Join institute to unit */}
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

      {/* Rename unit */}
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

      {/* Remove institute from unit */}
      <ConfirmDialog
        open={Boolean(removing)}
        title={`Take ${removing?.institute.shortCode ?? ''} out of the unit?`}
        message={
          removing
            ? removing.unit.instituteIds.length <= 2
              ? `"${removing.unit.name}" would have only one institute left, so the whole unit will be separated.`
              : `${removing.institute.shortCode} gets its own copy of the unit's roles. Other institutes stay in "${removing.unit.name}".`
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

      {/* Separate complete unit */}
      <ConfirmDialog
        open={Boolean(separating)}
        title="Separate this unit?"
        message={
          separating
            ? `Each institute of "${separating.name}" gets its own copy of the roles, and users keep their roles.`
            : ''
        }
        confirmLabel="Separate"
        loading={separateRequest.loading}
        onConfirm={confirm(
          () => separateRequest.run(separating.id),
          () => setSeparating(null),
          `"${separating?.name}" separated`,
        )}
        onClose={() => setSeparating(null)}
      />
    </>
  );
}
