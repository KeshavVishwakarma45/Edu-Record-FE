import { useEffect, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Box, Button, Typography } from '@mui/material';

import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';

// Photo validation function
const validatePhoto = (file) => {
  if (!file) return true;

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return 'Only JPG, PNG and WEBP images are allowed';
  }

  if (file.size > 2 * 1024 * 1024) {
    return 'Photo size must be 2 MB or smaller';
  }

  return true;
};

export default function FormPhotoUpload({ name, label = 'Student Photo' }) {
  const { control, setError, clearErrors } = useFormContext();

  const [preview, setPreview] = useState('');

  // Preview URL cleanup
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        validate: validatePhoto,
      }}
      render={({ field: { onChange }, fieldState }) => (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
          </Typography>

          {preview && (
            <Box
              component="img"
              src={preview}
              alt="Student photo preview"
              sx={{
                width: 120,
                height: 120,
                objectFit: 'cover',
                borderRadius: 2,
                mb: 1,
                display: 'block',
              }}
            />
          )}

          <Button component="label" variant="outlined" startIcon={<PhotoCameraOutlinedIcon />}>
            Choose Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (!file) return;

                const error = validatePhoto(file);

                if (error !== true) {
                  onChange(null);

                  setPreview('');

                  setError(name, {
                    type: 'validate',
                    message: error,
                  });
                } else {
                  clearErrors(name);

                  onChange(file);

                  setPreview(URL.createObjectURL(file));
                }

                event.target.value = '';
              }}
            />
          </Button>

          {preview && (
            <Button
              color="error"
              size="small"
              onClick={() => {
                onChange(null);
                clearErrors(name);
                setPreview('');
              }}
              startIcon={<DeleteOutlinedIcon />}
              sx={{ ml: 1 }}
            >
              Remove Photo
            </Button>
          )}

          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            JPG, PNG or WEBP. Maximum size: 2 MB.
          </Typography>

          {fieldState.error && (
            <Typography color="error" variant="caption">
              {fieldState.error.message}
            </Typography>
          )}
        </Box>
      )}
    />
  );
}
