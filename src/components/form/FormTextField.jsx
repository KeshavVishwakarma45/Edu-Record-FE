import { Controller, useFormContext } from 'react-hook-form';
import { TextField } from '@mui/material';

// A text input connected to the surrounding form (FormDialog or FormProvider).
//   <FormTextField name="name" label="Name" rules={{ required: 'Enter the name' }} />
// Any other prop (type, helperText, multiline, slotProps...) goes to the MUI TextField.
export default function FormTextField({ name, label, rules, helperText, ...props }) {
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
          value={field.value ?? ''}
          inputRef={ref}
          label={label}
          required={Boolean(rules?.required)}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message ?? helperText}
        />
      )}
    />
  );
}
