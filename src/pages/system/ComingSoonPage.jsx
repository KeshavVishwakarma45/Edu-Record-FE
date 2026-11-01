import { Paper } from '@mui/material';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';

// Placeholder for a module the interns have not built yet. Replace it in routes/routes.jsx.
export default function ComingSoonPage({ title, srsIds }) {
  return (
    <>
      <PageHeader title={title} />
      <Paper>
        <EmptyState title="Coming soon" description={`This page is being built (SRS ${srsIds}).`} />
      </Paper>
    </>
  );
}
