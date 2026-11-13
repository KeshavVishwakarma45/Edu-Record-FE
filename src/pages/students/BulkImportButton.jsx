import { useState } from 'react';
import { Button } from '@mui/material';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import { PERMISSIONS } from '@/constants/permissions';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';
import BulkImportDialog from './BulkImportDialog';

// "Bulk Add" button for the Students page header (SRS STU-04), placed beside "Add Student".
// It opens a popup, the same way "Add Student" does.
// onImported: the Students page passes its reload, so the table shows the new students.
export default function BulkImportButton({ onImported }) {
  const { can, allInstitutes, selectedInstitute } = useAuth();
  const notify = useNotify();
  const [open, setOpen] = useState(false);

  if (!can(PERMISSIONS.STUDENT_IMPORT)) return null;

  const handleOpen = () => {
    // The server does not allow import or template in the "All institutes" view
    if (allInstitutes || !selectedInstitute?.id) {
      notify.info('Choose one institute at the top first');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button variant="outlined" startIcon={<UploadFileOutlinedIcon />} onClick={handleOpen}>
        Bulk Add
      </Button>
      <BulkImportDialog
        open={open}
        instituteId={selectedInstitute?.id}
        onClose={() => setOpen(false)}
        onImported={onImported}
      />
    </>
  );
}
