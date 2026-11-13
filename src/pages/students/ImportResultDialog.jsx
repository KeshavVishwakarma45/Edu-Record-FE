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

// Step 1 (outcome is null): what the file check found, with an Import button.
// Step 2 (outcome is set): what the server did: how many were added and which rows it refused.
// result: { valid, errors } from validateStudentRows. null = dialog closed.
export default function ImportResultDialog({ result, outcome, importing, onImport, onClose }) {
  const valid = result?.valid ?? [];
  const errors = outcome ? outcome.errors : (result?.errors ?? []);
  const errorRows = new Set(errors.map((error) => error.row)).size;

  return (
    <Dialog
      open={Boolean(result)}
      onClose={importing ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{outcome ? 'Import result' : 'File check result'}</DialogTitle>
      <DialogContent dividers>
        {outcome ? (
          <Alert severity={errors.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
            {outcome.created} student(s) added. {errorRows} row(s) were refused by the server.
          </Alert>
        ) : (
          <Alert severity={errors.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
            {valid.length} row(s) are correct. {errorRows} row(s) have errors and will not be
            imported.
          </Alert>
        )}

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
        <Button onClick={onClose} disabled={importing}>
          Close
        </Button>
        {!outcome && (
          <Button
            variant="contained"
            disabled={valid.length === 0}
            loading={importing}
            onClick={onImport}
          >
            Import {valid.length} student(s)
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
