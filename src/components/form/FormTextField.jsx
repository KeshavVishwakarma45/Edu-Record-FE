import { Controller, useFormContext } from 'react-hook-form';

import { InputAdornment, TextField, Tooltip } from '@mui/material';

import ErrorIcon from '@mui/icons-material/Error';

// A text input connected to the surrounding form.
export default function FormTextField({ name, label, rules, helperText, ...props }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { ref, ...field }, fieldState }) => {
        const hasError = Boolean(fieldState.error);

        return (
          <TextField
            {...field}
            {...props}
            value={field.value ?? ''}
            inputRef={ref}
            label={label}
            required={Boolean(rules?.required)}
            error={hasError}
            helperText={fieldState.error?.message ?? helperText}
            slotProps={{
              ...props.slotProps,
              input: {
                ...props.slotProps?.input,
                endAdornment: hasError ? (
                  <InputAdornment position="end">
                    <Tooltip title={fieldState.error?.message || 'Invalid value'}>
                      <ErrorIcon color="error" fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                ) : (
                  props.slotProps?.input?.endAdornment
                ),
              },
            }}
          />
        );
      }}
    />
  );
}
