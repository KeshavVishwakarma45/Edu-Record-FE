import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import FormDialog from '@/components/FormDialog';
import FormTextField from '@/components/form/FormTextField';
import FormSelect from '@/components/form/FormSelect';
import FormCheckboxGroup from '@/components/form/FormCheckboxGroup';
import PreviewTable from './PreviewTable';

// Combine 2 or more separate institutes into a new unit. First press: preview; second: combine.

export const TEMPLATE = 'template';

function CombineFields({ separateInstitutes, preview, onEdit }) {
  const selected = useWatch({ name: 'instituteIds' }) ?? [];
  // Any change after a preview makes it out of date: ask for a new preview before combining
  const formKey = JSON.stringify(useWatch());
  useEffect(() => {
    onEdit();
  }, [formKey, onEdit]);

  const keepOptions = [
    ...separateInstitutes
      .filter((i) => selected.includes(i.id))
      .map((i) => ({ value: i.id, label: `Roles of ${i.shortCode} (${i.roleCount})` })),
    { value: TEMPLATE, label: 'Start from the default roles' },
  ];
  return (
    <>
      <FormTextField
        name="name"
        label="Unit name"
        rules={{ required: 'Enter a name for the unit' }}
      />
      <FormCheckboxGroup
        name="instituteIds"
        label="Institutes to combine"
        groups={[
          {
            label: 'Separate institutes',
            permissions: separateInstitutes.map((i) => ({
              value: i.id,
              label: `${i.shortCode} · ${i.name}`,
            })),
          },
        ]}
        rules={{ validate: (v) => v.length >= 2 || 'Choose at least 2 institutes' }}
      />
      <FormSelect
        name="keepRolesFrom"
        label="Which role list should the unit use?"
        options={keepOptions}
        rules={{ required: 'Choose the roles to keep' }}
      />
      {preview && <PreviewTable preview={preview} actionLabel="Combine" />}
    </>
  );
}

export default function CombineDialog({
  open,
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
      title="Combine institutes into a unit"
      defaultValues={{ name: '', instituteIds: [], keepRolesFrom: '' }}
      submitLabel={preview ? 'Combine' : 'Preview'}
      loading={loading}
      onSubmit={onSubmit}
      onClose={onClose}
    >
      <CombineFields separateInstitutes={separateInstitutes} preview={preview} onEdit={onEdit} />
    </FormDialog>
  );
}
