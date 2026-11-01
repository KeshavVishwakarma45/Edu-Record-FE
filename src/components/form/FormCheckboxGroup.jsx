import { Controller, useFormContext } from 'react-hook-form';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Typography,
} from '@mui/material';

// A list of tick boxes in titled groups, connected to the surrounding form.
// The form value is the array of ticked values, e.g. a role's permissions:
//   <FormCheckboxGroup name="permissions" label="Permissions" groups={PERMISSION_GROUPS} />
//   groups: [{ label, permissions: [{ value, label }] }]
export default function FormCheckboxGroup({ name, label, groups, rules, helperText }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => {
        const selected = field.value ?? [];
        const toggle = (value, checked) =>
          field.onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
        return (
          <FormControl component="fieldset" error={Boolean(fieldState.error)}>
            <FormLabel component="legend">{label}</FormLabel>
            {groups.map((group) => (
              <Box key={group.label} sx={{ mt: 1.5 }}>
                <Typography sx={{ fontWeight: 600 }}>{group.label}</Typography>
                <FormGroup>
                  {group.permissions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      label={option.label}
                      control={
                        <Checkbox
                          size="small"
                          checked={selected.includes(option.value)}
                          onChange={(event) => toggle(option.value, event.target.checked)}
                          onBlur={field.onBlur}
                        />
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            ))}
            {(fieldState.error || helperText) && (
              <FormHelperText>{fieldState.error?.message ?? helperText}</FormHelperText>
            )}
          </FormControl>
        );
      }}
    />
  );
}
