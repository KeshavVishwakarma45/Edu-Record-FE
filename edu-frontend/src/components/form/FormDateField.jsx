import dayjs from 'dayjs';
import { Controller, useFormContext } from 'react-hook-form';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// A date picker (dd/mm/yyyy) connected to the surrounding form.
// The form value is a 'YYYY-MM-DD' string (or null): a calendar date with no time,
// so a date of birth never shifts by a day between India time and UTC.
//   <FormDateField name="dob" label="Date of birth" rules={{ required: 'Enter the date of birth' }} />
export default function FormDateField({ name, label, rules, helperText, ...props }) {
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
            textField: {
              onBlur: field.onBlur,
              required: Boolean(rules?.required),
              error: Boolean(fieldState.error),
              helperText: fieldState.error?.message ?? helperText,
            },
          }}
        />
      )}
    />
  );
}
