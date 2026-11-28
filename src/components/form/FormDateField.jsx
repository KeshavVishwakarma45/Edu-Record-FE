import dayjs from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

export default function FormDateField({
  name,
  label,
  rules,
  helperText,
  slotProps = {},
  ...props
}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <DatePicker
          {...props}
          label={label}
          format="DD/MM/YYYY"
          value={field.value ? dayjs(field.value) : null}
          onChange={(value) => field.onChange(value?.isValid() ? value.format('YYYY-MM-DD') : null)}
          inputRef={field.ref}
          slotProps={{
            ...slotProps,
            textField: {
              ...slotProps.textField,
              fullWidth: true,
              onBlur: field.onBlur,
              required: Boolean(rules?.required),
              error: Boolean(fieldState.error),
              helperText: fieldState.error?.message ?? helperText,
              sx: {
                width: '100%',
                ...slotProps.textField?.sx,
              },
            },
          }}
          sx={{
            width: '100%',
            ...props.sx,
          }}
        />
      )}
    />
  );
}
