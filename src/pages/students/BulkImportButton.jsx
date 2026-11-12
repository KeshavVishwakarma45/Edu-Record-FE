import { useRef, useState } from 'react';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { coursesApi } from '@/api/courses';
import { studentImportApi } from '@/api/studentImport';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { useRequest } from '@/hooks/useRequest';
import {
  downloadStudentTemplate,
  readStudentRows,
  validateStudentRows,
} from '@/utils/studentExcel';
import ImportResultDialog from './ImportResultDialog';

// "Bulk Add" button for the Students page header (SRS STU-04), placed beside "Add Student".
// One button with a small menu: upload the filled Excel file, or download the template first.
// onImported: the Students page passes its list.reload, so the table shows the new students.
export default function BulkImportButton({ onImported }) {
  const { can, allInstitutes } = useAuth();
  const notify = useNotify();
  const fileInput = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null); // null = menu closed
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // the file check result; null = dialog closed
  const [outcome, setOutcome] = useState(null); // the server's answer after Import
  const importRequest = useRequest(studentImportApi.importStudents);

  if (!can(PERMISSIONS.STUDENT_IMPORT)) return null;

  const closeMenu = () => setMenuAnchor(null);

  const handleTemplate = () => {
    closeMenu();
    downloadStudentTemplate().catch(notify.error);
  };

  const handleChooseFile = () => {
    closeMenu();
    fileInput.current.click();
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // so the same file can be chosen again
    if (!file) return;
    if (allInstitutes) {
      notify.info('Choose one institute at the top first');
      return;
    }

    setBusy(true);
    try {
      const { rows: courses } = await coursesApi.list({ page: 1, limit: 100, sort: 'name' });
      const rows = await readStudentRows(file);
      setOutcome(null);
      setResult(validateStudentRows(rows, courses));
    } catch (error) {
      notify.error(error);
    } finally {
      setBusy(false);
    }
  };

  // Only the correct rows are sent (a row with any error is never sent)
  const handleImport = async () => {
    try {
      const answer = await importRequest.run(result.valid.map((item) => item.data));
      // The server says "student number 3 failed"; show the Excel row of that student
      const serverErrors = (answer.errors ?? []).map((error) => ({
        row: result.valid[error.index]?.row ?? '—',
        field: error.field,
        message: error.message,
      }));
      setOutcome({ created: answer.created, errors: serverErrors });
      if (answer.created > 0) {
        notify.success(`${answer.created} student(s) added`);
        if (onImported) onImported();
      }
    } catch (error) {
      notify.error(error);
    }
  };

  const handleClose = () => {
    setResult(null);
    setOutcome(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadFileOutlinedIcon />}
        endIcon={<ArrowDropDownIcon />}
        loading={busy}
        aria-haspopup="menu"
        onClick={(event) => setMenuAnchor(event.currentTarget)}
      >
        Bulk Add
      </Button>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={handleChooseFile}>
          <ListItemIcon>
            <UploadFileOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Upload Excel file</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleTemplate}>
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download template</ListItemText>
        </MenuItem>
      </Menu>

      <input ref={fileInput} type="file" accept=".xlsx" hidden onChange={handleFile} />

      <ImportResultDialog
        result={result}
        outcome={outcome}
        importing={importRequest.loading}
        onImport={handleImport}
        onClose={handleClose}
      />
    </>
  );
}
