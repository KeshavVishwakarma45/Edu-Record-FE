import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

export default function ImportResultDialog({ result, outcome, onClose }) {
  const errors = outcome?.errors ?? [];
  const errorRows = new Set(errors.map((error) => error.row)).size;

  return (
    <Dialog open={Boolean(result)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import result</DialogTitle>

      <DialogContent dividers>
        <Alert severity={outcome?.failed > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
          {outcome?.imported ?? 0} of {outcome?.totalRows ?? 0} student(s) imported.{' '}
          {outcome?.failed ?? 0} row(s) failed. {errorRows} row(s) have details below.
        </Alert>

        {errors.length > 0 && (
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Excel row</TableCell>
                  <TableCell>Column</TableCell>
                  <TableCell>Problem</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {errors.map((error, index) => (
                  <TableRow key={`${error.row}-${error.field}-${index}`}>
                    <TableCell>{error.row}</TableCell>
                    <TableCell>{error.field || '—'}</TableCell>
                    <TableCell>{error.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
