import { useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { studentImportApi } from '@/api/studentImport';
import { useNotify } from '@/hooks/useNotify';
import { useRequest } from '@/hooks/useRequest';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // the server accepts files up to 2 MB

// Saves a Blob as a file on the user's computer
function saveFile(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

// The "Bulk Add" popup (SRS STU-04): download the template, choose the filled .xlsx file,
// import it, and see the result in the same popup.
// onImported: the Students page can pass its list reload, so the table shows the new students.
export default function BulkImportDialog({ open, onClose, onImported }) {
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));

  // The content below only exists while the popup is open, so it starts fresh every time
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isPhone}>
      <BulkImportContent onClose={onClose} onImported={onImported} />
    </Dialog>
  );
}

function BulkImportContent({ onClose, onImported }) {
  const notify = useNotify();
  const fileInput = useRef(null);
  const [file, setFile] = useState(null); // the chosen .xlsx file
  const [result, setResult] = useState(null); // the server's answer after Import
  const templateRequest = useRequest(studentImportApi.downloadTemplate);
  const importRequest = useRequest(studentImportApi.importFile);

  const handleTemplate = async () => {
    try {
      saveFile(await templateRequest.run(), 'students-import-template.xlsx');
    } catch (error) {
      notify.error(error);
    }
  };

  const handleFileChosen = (event) => {
    const chosen = event.target.files[0];
    event.target.value = ''; // so the same file can be chosen again
    if (!chosen) return;
    if (!chosen.name.toLowerCase().endsWith('.xlsx')) {
      notify.error('Only .xlsx Excel files are allowed');
      return;
    }
    if (chosen.size > MAX_FILE_SIZE) {
      notify.error('File is too large (maximum 2 MB)');
      return;
    }
    setFile(chosen);
  };

  const handleImport = async () => {
    try {
      const answer = await importRequest.run(file);
      setResult(answer);
      if (answer.imported > 0) {
        notify.success(`${answer.imported} student(s) imported`);
        if (onImported) onImported();
      }
    } catch (error) {
      notify.error(error);
    }
  };

  const handleAnotherFile = () => {
    setResult(null);
    setFile(null);
  };

  return (
    <>
      <DialogTitle>Bulk Add Students</DialogTitle>
      <DialogContent dividers>
        {result ? (
          <ImportResult result={result} />
        ) : (
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>1. Download the template</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                Fill one student per row. Remove the sample row before uploading.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<FileDownloadOutlinedIcon />}
                loading={templateRequest.loading}
                onClick={handleTemplate}
              >
                Download template
              </Button>
            </Box>

            <Box>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>2. Choose the filled file</Typography>
              <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>
                Only .xlsx files, up to 2 MB.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<UploadFileOutlinedIcon />}
                  onClick={() => fileInput.current.click()}
                >
                  Choose file
                </Button>
                <Typography noWrap sx={{ color: file ? 'text.primary' : 'text.secondary' }}>
                  {file ? file.name : 'No file chosen'}
                </Typography>
              </Stack>
              <input
                ref={fileInput}
                type="file"
                accept=".xlsx"
                hidden
                onChange={handleFileChosen}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {result ? (
          <>
            <Button onClick={handleAnotherFile}>Import another file</Button>
            <Button variant="contained" onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose} disabled={importRequest.loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              disabled={!file}
              loading={importRequest.loading}
              onClick={handleImport}
            >
              Import
            </Button>
          </>
        )}
      </DialogActions>
    </>
  );
}

// result: { totalRows, imported, failed, errors: [{ row, messages | message }] }
// Normal row errors have "messages" (a list); a missing-column error has a single "message".
function ImportResult({ result }) {
  // One line per Excel row, and each message only once (the server may repeat a message)
  const messagesByRow = new Map();
  (result.errors ?? []).forEach((error) => {
    const texts = error.messages ?? [error.message];
    const known = messagesByRow.get(error.row) ?? [];
    messagesByRow.set(error.row, [...new Set([...known, ...texts])]);
  });
  const errorRows = [...messagesByRow.entries()];

  return (
    <>
      <Alert severity={errorRows.length > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
        {result.imported ?? 0} student(s) imported, {result.failed ?? 0} row(s) failed
        {result.totalRows ? ` (out of ${result.totalRows} rows)` : ''}.
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
    </>
  );
}
