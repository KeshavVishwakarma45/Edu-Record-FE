import { useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatDate } from '@/utils/format';

// Shows a one-time invite / password link for the admin to copy and send (WhatsApp, email).
// The link is shown only here: the server keeps only a hash of it.
export default function CopyLinkDialog({ open, title, link, expiresAt, onClose }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false); // the browser blocked the clipboard: the user can still select the text
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Send this link to the person. It works once and expires on {formatDate(expiresAt)}. It is
          shown only now; make a new one from the user list if it is lost.
        </Alert>
        <TextField
          label="Link"
          value={link ?? ''}
          slotProps={{ htmlInput: { readOnly: true } }}
          onFocus={(event) => event.target.select()}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<ContentCopyIcon />} onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
