import { Controller, useFormContext } from 'react-hook-form';
import { MenuItem, TextField } from '@mui/material';

// A drop-down connected to the surrounding form.
//   <FormSelect name="pattern" label="Pattern" options={[{ value: 'year', label: 'Year' }]} />
export default function FormSelect({ name, label, options, rules, helperText, ...props }) {
  const { control } = useFormContext();
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
          value={field.value ?? ''}
          inputRef={ref}
          label={label}
          required={Boolean(rules?.required)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
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
