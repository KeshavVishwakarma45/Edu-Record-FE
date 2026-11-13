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

export default function BulkImportButton({ onImported }) {
  const { can, allInstitutes, selectedInstitute } = useAuth();
  const notify = useNotify();

  const fileInput = useRef(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [result, setResult] = useState(null);
  const [outcome, setOutcome] = useState(null);

  const importRequest = useRequest(studentImportApi.importStudents);

  const busy = importRequest.loading;

  if (!can(PERMISSIONS.STUDENT_IMPORT)) {
    return null;
  }

  const closeMenu = () => {
    setMenuAnchor(null);
  };

  const getInstituteId = () => {
    if (allInstitutes || !selectedInstitute?.id) {
      notify.info('Choose one institute at the top first');
      return null;
    }

    return selectedInstitute.id;
  };

  const handleTemplate = async () => {
    closeMenu();

    const instituteId = getInstituteId();

    if (!instituteId) return;

    try {
      const blob = await studentImportApi.downloadTemplate(instituteId);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = 'student-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);
    } catch (error) {
      notify.error(error);
    }
  };

  const handleChooseFile = () => {
    closeMenu();

    const instituteId = getInstituteId();

    if (!instituteId) return;

    fileInput.current?.click();
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    const instituteId = getInstituteId();

    if (!instituteId) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      notify.error(new Error('Please select an .xlsx file'));
      return;
    }

    setOutcome(null);
    setResult(null);

    try {
      const answer = await importRequest.run(file, instituteId);

      const errors = (answer.errors ?? []).flatMap((error) => {
        const messages = error.messages ?? (error.message ? [error.message] : []);

        return messages.map((message) => ({
          row: error.row ?? '—',
          field: error.field ?? '',
          message,
        }));
      });

      setOutcome({
        totalRows: answer.totalRows,
        imported: answer.imported,
        failed: answer.failed,
        errors,
      });

      setResult({});

      if (answer.imported > 0) {
        notify.success(`${answer.imported} student(s) imported`);
        onImported?.();
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
        importing={busy}
        onClose={handleClose}
      />
    </>
  );
}
