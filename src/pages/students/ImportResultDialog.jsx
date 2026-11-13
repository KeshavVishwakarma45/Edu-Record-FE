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

// Shows what the server did with the file: how many students were added and which rows failed.
// result: { totalRows, imported, failed, errors: [{ row, messages | message }] }; null = closed.
// Normal row errors have "messages" (a list); a missing-column error has a single "message".
export default function ImportResultDialog({ result, onClose }) {
  // One line per Excel row, and each message only once (the server may repeat a message)
  const messagesByRow = new Map();
  (result?.errors ?? []).forEach((error) => {
    const texts = error.messages ?? [error.message];
    const known = messagesByRow.get(error.row) ?? [];
    messagesByRow.set(error.row, [...new Set([...known, ...texts])]);
  });
  const errorRows = [...messagesByRow.entries()];

  return (
    <Dialog open={Boolean(result)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Import result</DialogTitle>
      <DialogContent dividers>
        <Alert severity={errorRows.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
          {result?.imported ?? 0} student(s) imported, {result?.failed ?? 0} row(s) failed
          {result?.totalRows ? ` (out of ${result.totalRows} rows)` : ''}.
        </Alert>

        {errorRows.length > 0 && (
          <TableContainer sx={{ maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Excel row</TableCell>
                  <TableCell>Problem</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {errorRows.map(([row, texts]) => (
                  <TableRow key={row}>
                    <TableCell>{row}</TableCell>
                    <TableCell>{texts.join('; ')}</TableCell>
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
