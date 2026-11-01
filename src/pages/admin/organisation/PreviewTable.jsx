import {
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

// What combining (or adding an institute to a unit) will do to each user, shown before it happens.
//   preview: { keptRoles: ['Admin', ...], assignments: [{ userId, name, from, toRoleName }] }
export default function PreviewTable({ preview, actionLabel }) {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 1 }}>
        The unit will use these roles: {preview.keptRoles.join(', ')}. Check each person below, then
        press {actionLabel}.
      </Alert>
      {preview.assignments.length > 0 && (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 480 }}>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Now</TableCell>
                <TableCell>After</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {preview.assignments.map((a) => (
                <TableRow key={a.userId}>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>
                    {a.from.map((f) => `${f.institute}: ${f.roleName}`).join(', ')}
                  </TableCell>
                  <TableCell sx={{ color: a.toRoleName ? 'text.primary' : 'error.main' }}>
                    {a.toRoleName ?? 'No role with that name: access removed'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
