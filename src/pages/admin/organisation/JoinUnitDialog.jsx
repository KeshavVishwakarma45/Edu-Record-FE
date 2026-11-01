import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import { Typography } from '@mui/material';
import FormDialog from '@/components/FormDialog';
import FormSelect from '@/components/form/FormSelect';
import PreviewTable from './PreviewTable';

// Add one separate institute to an existing unit. Opened from a unit card (unit fixed, choose the
// institute) or from an institute card (institute fixed, choose the unit).
// First press: preview what happens to its staff; second press: add it.

function JoinFields({ fixed, units, separateInstitutes, preview, onEdit }) {
  const formKey = JSON.stringify(useWatch());
  useEffect(() => {
    onEdit();
  }, [formKey, onEdit]);

  return (
    <>
      {fixed.unit ? (
        <Typography>Unit: {fixed.unit.name}</Typography>
      ) : (
        <FormSelect
          name="unitId"
          label="Unit"
          options={units.map((u) => ({ value: u.id, label: u.name }))}
          rules={{ required: 'Choose the unit' }}
        />
      )}
      {fixed.institute ? (
        <Typography>
          Institute: {fixed.institute.shortCode} · {fixed.institute.name}
        </Typography>
      ) : (
        <FormSelect
          name="instituteId"
          label="Institute to add"
          options={separateInstitutes.map((i) => ({
            value: i.id,
            label: `${i.shortCode} · ${i.name}`,
          }))}
          rules={{ required: 'Choose the institute' }}
        />
      )}
      <Typography sx={{ color: 'text.secondary' }}>
        The institute will use the unit&apos;s roles and staff. Its own roles are replaced; each of
        its users gets the unit role with the same name.
      </Typography>
      {preview && <PreviewTable preview={preview} actionLabel="Add to unit" />}
    </>
  );
}

export default function JoinUnitDialog({
  open,
  fixed,
  units,
  separateInstitutes,
  preview,
  loading,
  onSubmit,
  onEdit,
  onClose,
}) {
  return (
    <FormDialog
      open={open}
      title="Add an institute to a unit"
      defaultValues={{ unitId: fixed.unit?.id ?? '', instituteId: fixed.institute?.id ?? '' }}
      submitLabel={preview ? 'Add to unit' : 'Preview'}
      loading={loading}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <JoinFields
        fixed={fixed}
        units={units}
        separateInstitutes={separateInstitutes}
        preview={preview}
        onEdit={onEdit}
      />
    </FormDialog>
  );
}
