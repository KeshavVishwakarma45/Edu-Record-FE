import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
} from '@mui/material';

const getStatusColor = (status) => {
  switch (status) {
    case 'CLEAR':
      return 'success';
    case 'NOT_CLEAR':
      return 'error';
    default:
      return 'warning';
  }
};

export default function DepartmentQueue({ items = [], onStatusChange, loading = false }) {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Department Clearance Queue
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review student clearance requests assigned to your department.
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Student</strong>
              </TableCell>
              <TableCell>
                <strong>Department</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell>
                <strong>Remark</strong>
              </TableCell>
              <TableCell>
                <strong>Amount Due</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No clearance requests available.</Typography>
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.studentName || item.studentId || '—'}</TableCell>

                <TableCell>{item.departmentName || '—'}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={item.status || 'PENDING'}
                    color={getStatusColor(item.status)}
                  />
                </TableCell>

                <TableCell>{item.remark || '—'}</TableCell>

                <TableCell>₹{item.amountDue ?? 0}</TableCell>

                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      color="success"
                      variant="outlined"
                      disabled={!onStatusChange}
                      onClick={() => onStatusChange(item, 'CLEAR')}
                    >
                      Clear
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={!onStatusChange}
                      onClick={() => onStatusChange(item, 'NOT_CLEAR')}
                    >
                      Not Clear
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
