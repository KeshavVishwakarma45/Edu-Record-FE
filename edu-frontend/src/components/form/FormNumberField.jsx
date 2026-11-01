import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';

// A number input connected to the surrounding form. The form value is a number ('' when empty).
//   <FormNumberField name="duration" label="Duration" min={1} max={12} rules={{ required: '...' }} />
export default function FormNumberField({ name, label, rules, helperText, min, max, ...props }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, onChange, ...field }, fieldState }) => (
        <TextField
          {...field}
          {...props}
          type="number"
          value={field.value ?? ''}
          onChange={(event) =>
            onChange(event.target.value === '' ? '' : Number(event.target.value))
          }
          inputRef={ref}
          label={label}
          required={Boolean(rules?.required)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
          slotProps={{ htmlInput: { inputMode: 'numeric', min, max } }}
        />
      )}
    />
  );
}
