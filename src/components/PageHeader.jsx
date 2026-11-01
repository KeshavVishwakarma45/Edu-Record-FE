import { Link as RouterLink } from 'react-router-dom';
import { Box, Breadcrumbs, Link, Stack, Typography } from '@mui/material';

// The top of every page: title, optional subtitle and breadcrumbs, and action buttons on the right.
//   <PageHeader title="Courses" subtitle="..." actions={<Button>Add course</Button>} />
//   breadcrumbs: [{ label: 'Students', to: '/students' }, { label: 'Asha Patel' }]
export default function PageHeader({ title, subtitle, breadcrumbs, actions }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'flex-end' } }}
    >
      <Box sx={{ minWidth: 0 }}>
        {breadcrumbs?.length > 0 && (
          <Breadcrumbs aria-label="Breadcrumb" sx={{ mb: 0.5 }}>
            {breadcrumbs.map((crumb) =>
              crumb.to ? (
                <Link key={crumb.label} component={RouterLink} to={crumb.to} underline="hover">
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={crumb.label} sx={{ color: 'text.primary' }}>
                  {crumb.label}
                </Typography>
              ),
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle && <Typography sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
