import { useEffect, useState } from 'react';

import { Avatar, Box, Button, Chip, Grid, Paper, Typography } from '@mui/material';

import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

import { studentsApi } from '@/api/students';
import { useAuth } from '@/hooks/useAuth';
import { useRequest } from '@/hooks/useRequest';
import { useNotify } from '@/hooks/useNotify';

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const StudentProfileHeader = ({ student, onPhotoUploaded }) => {
  const [photoUrl, setPhotoUrl] = useState('');

  const { selectedInstitute, allInstitutes } = useAuth();
  const notify = useNotify();

  const { run: uploadPhoto, loading: photoUploading } = useRequest(studentsApi.uploadPhoto);

  useEffect(() => {
    let isActive = true;
    let objectUrl = '';

    const loadPhoto = async () => {
      if (!student?.photo || !selectedInstitute?.id) {
        setPhotoUrl('');
        return;
      }

      try {
        const blob = await studentsApi.getPhoto(student.photo, selectedInstitute.id);

        if (!isActive) return;

        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      } catch {
        if (isActive) {
          setPhotoUrl('');
        }
      }
    };

    loadPhoto();

    return () => {
      isActive = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [student?.photo, selectedInstitute?.id]);

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      notify.error('Only JPG, PNG and WEBP images are allowed');
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      notify.error('Photo size must be 2 MB or smaller');
      return;
    }

    if (allInstitutes || !selectedInstitute?.id) {
      notify.error('Please select one institute first');
      return;
    }

    try {
      await uploadPhoto(student._id, file, selectedInstitute.id);

      await onPhotoUploaded?.();

      notify.success('Student photo uploaded successfully');
    } catch (error) {
      notify.error(error?.message || 'Unable to upload student photo');
    }
  };

  if (!student) {
    return null;
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
        <Avatar
          src={photoUrl || undefined}
          alt={student.name}
          sx={{
            width: 88,
            height: 88,
            fontSize: 32,
          }}
        >
          {student.name?.charAt(0)?.toUpperCase()}
        </Avatar>

        <Box flex={1} minWidth={200}>
          <Typography variant="h5" fontWeight={600}>
            {student.name}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Scholar No: {student.scholarNo || '—'}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Enrollment No: {student.enrollmentNo || '—'}
          </Typography>

          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<PhotoCameraOutlinedIcon />}
            disabled={photoUploading || allInstitutes || !selectedInstitute?.id}
            sx={{ mt: 1 }}
          >
            {photoUploading ? 'Uploading...' : student.photo ? 'Change Photo' : 'Upload Photo'}

            <input
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
            />
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            JPG, PNG or WEBP. Maximum size: 2 MB.
          </Typography>
        </Box>

        <Chip
          label={student.status || 'Unknown'}
          color={student.status === 'active' ? 'success' : 'default'}
          variant="outlined"
        />
      </Box>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Course
          </Typography>

          <Typography fontWeight={500}>{student.course || '—'}</Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Branch
          </Typography>

          <Typography fontWeight={500}>{student.branch || '—'}</Typography>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Typography variant="caption" color="text.secondary">
            Batch
          </Typography>

          <Typography fontWeight={500}>{student.batch || '—'}</Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StudentProfileHeader;
