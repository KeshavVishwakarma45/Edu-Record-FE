import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox, FormControl, FormControlLabel, FormHelperText } from '@mui/material';

// A tick box connected to the surrounding form. The form value is true or false.
//   <FormCheckbox name="mandatory" label="Mandatory for TC" />
export default function FormCheckbox({ name, label, rules, helperText, ...props }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, value, onChange, ...field }, fieldState }) => (
        <FormControl error={Boolean(fieldState.error)}>
          <FormControlLabel
            label={label}
            control={
              <Checkbox
                {...field}
                {...props}
                checked={Boolean(value)}
                onChange={(event) => onChange(event.target.checked)}
                slotProps={{ input: { ref } }}
              />
            }
          />
          {(fieldState.error || helperText) && (
            <FormHelperText>{fieldState.error?.message ?? helperText}</FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}
