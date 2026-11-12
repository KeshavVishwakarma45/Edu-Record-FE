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
import { STUDENT_COLUMNS } from '@/utils/studentExcel';

const headerOf = (field) => STUDENT_COLUMNS.find((column) => column.key === field)?.header ?? field;

// Shows what the file check found: how many rows are fine and every problem, row by row.
// result: { valid: [...], errors: [{ row, field, message }] } or null (dialog closed)
export default function ImportResultDialog({ result, onClose }) {
  const valid = result?.valid ?? [];
  const errors = result?.errors ?? [];
  const errorRows = new Set(errors.map((error) => error.row)).size;

  return (
    <Dialog open={Boolean(result)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>File check result</DialogTitle>
      <DialogContent dividers>
        <Alert severity={errors.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
          {valid.length} row(s) are correct. {errorRows} row(s) have errors and will not be
          imported.
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
                {errors.map((error) => (
                  <TableRow key={`${error.row}-${error.field}-${error.message}`}>
                    <TableCell>{error.row}</TableCell>
                    <TableCell>{headerOf(error.field)}</TableCell>
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
