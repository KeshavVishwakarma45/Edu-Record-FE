import { Box, Card, CardContent, Typography } from '@mui/material';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/hooks/useAuth';

// The four numbers every staff member checks first (SRS screen 2).
// Values are "—" until the modules that own them add a count endpoint:
// inward and custody (Module B), clearance (Module B), TC approval (Module C).
const CARDS = [
  { title: 'Pending inward', hint: 'Documents expected or not received' },
  { title: 'Documents in custody', hint: 'Waiting to be handed over' },
  { title: 'Clearance queue', hint: 'Department clearances pending' },
  { title: 'TCs awaiting approval', hint: 'Drafts waiting for the Principal' },
];

export default function DashboardPage() {
  const { user, selectedInstitute } = useAuth();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome, ${user.name} · ${selectedInstitute?.name ?? ''}`}
      />
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
        }}
      >
        {CARDS.map((card) => (
          <Card key={card.title}>
            <CardContent>
              <Typography component="h2" sx={{ fontWeight: 600 }}>
                {card.title}
              </Typography>
              <Typography
                sx={{ fontSize: '2rem', fontWeight: 700, my: 1 }}
                aria-label="Not available yet"
              >
                —
              </Typography>
              <Typography sx={{ color: 'text.secondary' }}>{card.hint}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
}
