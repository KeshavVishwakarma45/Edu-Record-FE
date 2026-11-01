import { Controller, useFormContext } from 'react-hook-form';
import { MenuItem, TextField } from '@mui/material';

// A drop-down connected to the surrounding form.
//   <FormSelect name="pattern" label="Pattern" options={[{ value: 'year', label: 'Year' }]} />
//   multiple: pick several; the form value is then an array, e.g. departmentIds
export default function FormSelect({
  name,
  label,
  options,
  rules,
  helperText,
  multiple = false,
  ...props
}) {
  const { control } = useFormContext();
  const labelOf = (value) => options.find((o) => o.value === value)?.label ?? value;
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, ...field }, fieldState }) => (
        <TextField
          {...field}
          {...props}
          select
          value={field.value ?? (multiple ? [] : '')}
          inputRef={ref}
          label={label}
          required={Boolean(rules?.required)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          slotProps={
            multiple
              ? { select: { multiple: true, renderValue: (v) => v.map(labelOf).join(', ') } }
              : undefined
          }
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
