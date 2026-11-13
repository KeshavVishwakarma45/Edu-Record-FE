import { useRef, useState } from 'react';
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { studentImportApi } from '@/api/studentImport';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import { useRequest } from '@/hooks/useRequest';
import ImportResultDialog from './ImportResultDialog';

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

// "Bulk Add" button for the Students page header (SRS STU-04), placed beside "Add Student".
// One button with a small menu: upload the filled Excel file, or download the template first.
// onImported: the Students page can pass its list reload, so the table shows the new students.
export default function BulkImportButton({ onImported }) {
  const { can, allInstitutes } = useAuth();
  const notify = useNotify();
  const fileInput = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null); // null = menu closed
  const [result, setResult] = useState(null); // the server's answer; null = dialog closed
  const templateRequest = useRequest(studentImportApi.downloadTemplate);
  const importRequest = useRequest(studentImportApi.importFile);

  if (!can(PERMISSIONS.STUDENT_IMPORT)) return null;

  const closeMenu = () => setMenuAnchor(null);

  // The server does not allow import or template in the "All institutes" view
  const needsOneInstitute = () => {
    if (!allInstitutes) return false;
    notify.info('Choose one institute at the top first');
    return true;
  };

  const handleTemplate = async () => {
    closeMenu();
    if (needsOneInstitute()) return;
    try {
      saveFile(await templateRequest.run(), 'students-import-template.xlsx');
    } catch (error) {
      notify.error(error);
    }
  };

  const handleChooseFile = () => {
    closeMenu();
    if (needsOneInstitute()) return;
    fileInput.current.click();
  };

  const handleFile = async (event) => {
    const file = event.target.files[0];
    event.target.value = ''; // so the same file can be chosen again
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      notify.error('Only .xlsx Excel files are allowed');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      notify.error('File is too large (maximum 2 MB)');
      return;
    }

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

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<UploadFileOutlinedIcon />}
        endIcon={<ArrowDropDownIcon />}
        loading={importRequest.loading || templateRequest.loading}
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

      <ImportResultDialog result={result} onClose={() => setResult(null)} />
    </>
  );
}
