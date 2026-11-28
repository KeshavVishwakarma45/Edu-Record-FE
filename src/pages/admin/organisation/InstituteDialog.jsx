import { useEffect, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { organisationApi } from '@/api/organisation';
import { rolesApi } from '@/api/roles';
import FormDialog from '@/components/FormDialog';
import FormTextField from '@/components/form/FormTextField';
import FormSelect from '@/components/form/FormSelect';
import FormNumberField from '@/components/form/FormNumberField';
import FormCheckbox from '@/components/form/FormCheckbox';
import FormCheckboxGroup from '@/components/form/FormCheckboxGroup';
import { useNotify } from '@/hooks/useNotify';

const NEW_INSTITUTE = {
  name: '',
  shortCode: '',
  address: '',
  website: '',
  principalName: '',
  universityId: '',
  affiliatedFrom: '',
  affiliatedTo: '',
  unitId: '',
  defaultDepartments: true,
  logoFile: null,
  principalSignatureFile: null,
  removeLogo: false,
  removePrincipalSignature: false,
};

function StartingRoles() {
  const [templates, setTemplates] = useState([]);
  const { getValues, setValue } = useFormContext();
  const notify = useNotify();

  useEffect(() => {
    let active = true;
    rolesApi
      .templates()
      .then((list) => {
        if (!active) return;
        setTemplates(list);
        if (getValues('roleTemplates') === undefined) {
          setValue(
            'roleTemplates',
            list.map((template) => template.name),
          );
        }
      })
      .catch(notify.error);
    return () => {
      active = false;
    };
  }, [getValues, setValue, notify]);

  return (
    <FormCheckboxGroup
      name="roleTemplates"
      label="Starting roles"
      helperText="Untick roles this institute does not need. You can add or change roles later on the Roles page."
      groups={[
        {
          label: 'Built-in roles',
          permissions: templates.map((template) => ({
            value: template.name,
            label: `${template.name}: ${template.description}`,
          })),
        },
      ]}
    />
  );
}

function AffiliationFields() {
  const [universities, setUniversities] = useState([]);
  const notify = useNotify();
  const universityId = useWatch({ name: 'universityId' });

  useEffect(() => {
    let active = true;
    organisationApi
      .universities()
      .then((rows) => active && setUniversities(rows))
      .catch(notify.error);
    return () => {
      active = false;
    };
  }, [notify]);

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" fontWeight={700}>
        Affiliation details
      </Typography>
      <FormSelect
        name="universityId"
        label="Affiliated university"
        options={[{ value: '', label: 'Not affiliated / Clear affiliation' }, ...universities]}
      />
      {universityId && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <FormNumberField
            name="affiliatedFrom"
            label="Affiliation starting year"
            min={1950}
            max={2100}
            rules={{ required: 'Enter the starting year' }}
          />
          <FormNumberField
            name="affiliatedTo"
            label="Affiliation ending year"
            min={1950}
            max={2100}
            helperText="Leave blank if the affiliation is ongoing."
            rules={{
              validate: (value, values) =>
                !value ||
                !values.affiliatedFrom ||
                Number(value) >= Number(values.affiliatedFrom) ||
                'Ending year cannot be before starting year',
            }}
          />
        </Box>
      )}
    </Stack>
  );
}

function InstituteAssetField({ name, label, icon: Icon, existingFileId, instituteId, removeName }) {
  const { control, setValue, clearErrors, setError } = useFormContext();
  const selectedFile = useWatch({ name });
  const removeExisting = useWatch({ name: removeName });
  const [preview, setPreview] = useState('');
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    if (selectedFile instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        if (active) {
          setPreview(String(reader.result || ''));
          setPreviewError(false);
        }
      };
      reader.onerror = () => active && setPreviewError(true);
      reader.readAsDataURL(selectedFile);
      return () => {
        active = false;
        reader.abort();
      };
    }
    if (removeExisting || !existingFileId || !instituteId) {
      return undefined;
    }
    organisationApi
      .getFile(existingFileId, instituteId)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreview(objectUrl);
        setPreviewError(false);
      })
      .catch(() => {
        if (active) setPreviewError(true);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile, existingFileId, instituteId, removeExisting]);

  const removeAsset = () => {
    setValue(name, null, { shouldDirty: true });
    setValue(removeName, Boolean(existingFileId), { shouldDirty: true });
    clearErrors(name);
    setPreview('');
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: (file) =>
          !file ||
          (['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
            file.size <= 2 * 1024 * 1024) ||
          'Choose a JPG, PNG or WEBP image up to 2 MB',
      }}
      render={({ field: { onChange }, fieldState }) => (
        <Box
          sx={{
            minWidth: 0,
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Icon fontSize="small" color="action" />
            <Typography variant="subtitle2" fontWeight={700}>
              {label}
            </Typography>
          </Stack>
          <Box
            sx={{
              height: 112,
              borderRadius: 1.5,
              bgcolor: 'action.hover',
              border: '1px dashed',
              borderColor: 'divider',
              display: 'grid',
              placeItems: 'center',
              overflow: 'hidden',
              mb: 1.5,
            }}
          >
            {preview ? (
              <Box
                component="img"
                src={removeExisting ? '' : preview}
                alt={`${label} preview`}
                sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                {previewError ? 'Preview unavailable' : 'No image selected'}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button component="label" size="small" variant="outlined" startIcon={<Icon />}>
              {existingFileId || selectedFile ? 'Change image' : 'Choose image'}
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  if (
                    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                    file.size > 2 * 1024 * 1024
                  ) {
                    setValue(name, null);
                    setValue(removeName, false);
                    setError(name, {
                      type: 'validate',
                      message: 'Choose a JPG, PNG or WEBP image up to 2 MB',
                    });
                    return;
                  }
                  clearErrors(name);
                  setValue(removeName, false, { shouldDirty: true });
                  onChange(file);
                }}
              />
            </Button>
            {(preview || existingFileId || selectedFile) && (
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineOutlinedIcon />}
                onClick={removeAsset}
              >
                Remove
              </Button>
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            JPG, PNG or WEBP · Maximum 2 MB
          </Typography>
          {fieldState.error && (
            <Typography variant="caption" color="error" display="block">
              {fieldState.error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}

function NewInstituteFields({ units }) {
  const unitId = useWatch({ name: 'unitId' });

  return (
    <>
      <FormSelect
        name="unitId"
        label="Roles and staff"
        options={[
          { value: '', label: 'Separate institute: its own roles and staff' },
          ...units.map((unit) => ({
            value: unit.id,
            label: `Join "${unit.name}": shared roles and staff`,
          })),
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
  const affiliation = institute?.affiliations?.[0];

  const defaultValues = editing
    ? {
        name: institute.name,
        address: institute.address ?? '',
        website: institute.website ?? '',
        principalName: institute.principalName ?? '',
        universityId: affiliation?.universityId ? String(affiliation.universityId) : '',
        affiliatedFrom: affiliation?.fromYear ?? '',
        affiliatedTo: affiliation?.toYear ?? '',
        ...(inUnit ? { roleIds: (institute.roleIds ?? []).map(String) } : {}),
        logoFile: null,
        principalSignatureFile: null,
        removeLogo: false,
        removePrincipalSignature: false,
      }
    : NEW_INSTITUTE;

  return (
    <FormDialog
      open={open}
      title={editing ? `Edit ${institute.shortCode}` : 'Add institute'}
      defaultValues={defaultValues}
      submitLabel={editing ? 'Save changes' : 'Add institute'}
      loading={loading}
      maxWidth="md"
      onSubmit={onSubmit}
      onClose={onClose}
      contentSx={{ gap: 2.25 }}
    >
      <Typography variant="subtitle2" fontWeight={700}>
        Institute information
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
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
        <FormTextField name="website" label="Website (optional)" />
        <FormTextField name="principalName" label="Principal / Director name" />
        <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
          <FormTextField name="address" label="Address" multiline minRows={2} />
        </Box>
      </Box>

      <Divider />
      <Typography variant="subtitle2" fontWeight={700}>
        Institute branding
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          gap: 2,
        }}
      >
        <InstituteAssetField
          name="logoFile"
          removeName="removeLogo"
          label="Institute logo"
          icon={PhotoCameraOutlinedIcon}
          existingFileId={institute?.logo}
          instituteId={institute?.id}
        />
        <InstituteAssetField
          name="principalSignatureFile"
          removeName="removePrincipalSignature"
          label="Principal signature"
          icon={DrawOutlinedIcon}
          existingFileId={institute?.principalSignature}
          instituteId={institute?.id}
        />
      </Box>

      <Divider />
      <AffiliationFields />

      {!editing && (
        <>
          <Divider />
          <Typography variant="subtitle2" fontWeight={700}>
            Institute setup
          </Typography>
          <NewInstituteFields units={units} />
        </>
      )}

      {inUnit && (
        <>
          <Divider />
          <FormCheckboxGroup
            name="roleIds"
            label={`Roles used in ${institute.shortCode}`}
            helperText={`The unit's roles. Staff whose role is not ticked can no longer open ${institute.shortCode} (they keep the other institutes). Add new roles on the Roles page.`}
            groups={[
              {
                label: 'Roles of the unit',
                permissions: unitRoles.map((role) => ({
                  value: String(role.id),
                  label: role.name,
                })),
              },
            ]}
          />
        </>
      )}
    </FormDialog>
  );
}
