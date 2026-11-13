import { Avatar, Box, Chip, Grid, Paper, Typography } from '@mui/material';

const StudentProfileHeader = ({ student }) => {
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
      {/* Student basic information */}
      <Box display="flex" alignItems="center" gap={3} flexWrap="wrap">
        <Avatar
          src={student.photo || undefined}
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
        </Box>

        <Chip
          label={student.status || 'Unknown'}
          color={student.status === 'active' ? 'success' : 'default'}
          variant="outlined"
        />
      </Box>

      {/* Student academic information */}
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
