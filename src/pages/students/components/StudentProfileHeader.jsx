import { useEffect, useState } from 'react';

import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';

import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';

import { studentsApi } from '@/api/students';
import { useAuth } from '@/hooks/useAuth';

const formatDisplayDate = (value) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const StudentProfileHeader = ({
  student,
  courses = [],
  onEdit,
  onStartTC,
  onDelete,
  onPhotoChange,
  canWrite = false,
  photoUploading = false,
}) => {
  const [photoUrl, setPhotoUrl] = useState('');
  const { selectedInstitute } = useAuth();

  const instituteId = student?.instituteId?._id || student?.instituteId || selectedInstitute?.id;

  useEffect(() => {
    let isActive = true;
    let objectUrl = '';

    const loadPhoto = async () => {
      if (!student?.photo || !instituteId) {
        setPhotoUrl('');
        return;
      }

      try {
        const blob = await studentsApi.getPhoto(student.photo, instituteId);

        if (!isActive) return;

        objectUrl = URL.createObjectURL(blob);
        setPhotoUrl(objectUrl);
      } catch {
        if (isActive) setPhotoUrl('');
      }
    };

    loadPhoto();

    return () => {
      isActive = false;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [student?.photo, instituteId]);

  if (!student) return null;

  const courseId = student.courseId?._id || student.courseId;

  const matchedCourse = courses.find((course) => course._id === courseId);

  const courseName =
    matchedCourse?.name ||
    student.course?.name ||
    student.courseName ||
    (typeof student.course === 'string' ? student.course : '') ||
    '—';

  const batch =
    student.batch ||
    student.academicSession?.name ||
    student.academicSession ||
    student.session?.name ||
    student.session ||
    '—';

  const status = student.status || 'Unknown';

  const statusColor =
    status.toLowerCase() === 'studying'
      ? 'primary'
      : status.toLowerCase() === 'passed out'
        ? 'success'
        : 'default';

  const parentDetails =
    student.fatherName || student.motherName
      ? `${student.gender?.toLowerCase() === 'female' ? 'D/o' : 'S/o'} ${
          student.fatherName || '—'
        }${student.motherName ? ` and ${student.motherName}` : ''}`
      : '';

  const details = [
    {
      label: 'Scholar No.',
      value: student.scholarNo,
    },
    {
      label: 'University Enrollment No.',
      value: student.enrollmentNo,
    },
    {
      label: 'Roll No.',
      value: student.rollNo,
    },
    {
      label: 'Date of Birth',
      value: formatDisplayDate(student.dob),
    },
    {
      label: 'Category',
      value: student.category,
    },
    {
      label: 'Mobile',
      value: student.mobile,
    },
  ];

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 3,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2.5,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={photoUrl || undefined}
            alt={student.name}
            sx={{
              width: 88,
              height: 88,
              borderRadius: 3,
              bgcolor: 'primary.light',
              color: 'primary.dark',
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            {student.name?.charAt(0)?.toUpperCase()}
          </Avatar>

          {canWrite && (
            <Tooltip title="Change student photo">
              <IconButton
                component="label"
                size="small"
                disabled={photoUploading}
                aria-label="Upload student photo"
                sx={{
                  position: 'absolute',
                  right: -8,
                  bottom: -8,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  boxShadow: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <PhotoCameraOutlinedIcon fontSize="small" />

                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPhotoChange}
                />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Typography variant="h5" fontWeight={750} sx={{ overflowWrap: 'anywhere' }}>
              {student.name || 'Student'}
            </Typography>

            <Chip label={status} color={statusColor} size="small" sx={{ fontWeight: 600 }} />
          </Box>

          {parentDetails && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {parentDetails}
            </Typography>
          )}

          <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>
            {courseName} · Batch {batch} · Year pattern
          </Typography>

          {photoUploading && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              Uploading photo...
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            ml: { md: 'auto' },
          }}
        >
          {canWrite && (
            <>
              <Button
                variant="outlined"
                color="inherit"
                onClick={onEdit}
                startIcon={<EditOutlinedIcon />}
                sx={{
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                Edit details
              </Button>

              <Button
                variant="contained"
                onClick={onStartTC}
                sx={{
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                Start TC application
              </Button>

              <Tooltip title="Delete student">
                <IconButton color="error" onClick={onDelete} aria-label="Delete student">
                  <DeleteOutlinedIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, minmax(0, 1fr))',
            sm: 'repeat(3, minmax(0, 1fr))',
            lg: 'repeat(5, minmax(0, 1fr))',
          },
          columnGap: 3,
          rowGap: 2,
        }}
      >
        {details.map((item) => (
          <Box key={item.label} sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ textTransform: 'uppercase' }}
            >
              {item.label}
            </Typography>

            <Typography
              variant="body2"
              fontWeight={650}
              sx={{
                mt: 0.35,
                overflowWrap: 'anywhere',
              }}
            >
              {item.value || '—'}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default StudentProfileHeader;
