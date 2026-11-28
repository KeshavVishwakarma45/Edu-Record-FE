import { useCallback, useEffect, useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';

import { handoverApi } from '@/api/handover';
import { useNotify } from '@/hooks/useNotify';

const formatDate = (value) => {
  if (!value) return '—';

  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) return '—';

  return `${day}/${month}/${year}`;
};

const getErrorMessage = (error) =>
  error?.response?.data?.error?.message ||
  error?.response?.data?.message ||
  error?.message ||
  'Something went wrong. Please try again.';

const formatFileSize = (size) => {
  if (!size) return '0 KB';

  return `${(size / 1024).toFixed(1)} KB`;
};

const StudentDocumentsTab = ({ studentId, student, instituteId, canIssueHandover = true }) => {
  const notify = useNotify();

  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const [handoverOpen, setHandoverOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [receiverName, setReceiverName] = useState('');
  const [receiverMobile, setReceiverMobile] = useState('');

  const [receiverPhoto, setReceiverPhoto] = useState(null);
  const [signedReceipt, setSignedReceipt] = useState(null);

  const loadDocuments = useCallback(
    async ({ showLoading = true, clearError = true } = {}) => {
      if (!studentId || !instituteId) return;

      if (showLoading) {
        setLoading(true);
      }

      if (clearError) {
        setError('');
      }

      try {
        const result = await handoverApi.listStudentDocuments(studentId, instituteId);

        setDocuments(result?.documents ?? []);
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(false);
      }
    },
    [studentId, instituteId],
  );

  const loadHistory = useCallback(
    async ({ showLoading = true } = {}) => {
      if (!studentId || !instituteId) return;

      if (showLoading) {
        setHistoryLoading(true);
      }

      try {
        const result = await handoverApi.listHistory(studentId, instituteId);

        setHistory(result?.rows ?? []);
      } catch {
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    },
    [studentId, instituteId],
  );

  const refreshData = useCallback(
    async ({ showLoading = true } = {}) => {
      await Promise.all([loadDocuments({ showLoading }), loadHistory({ showLoading })]);
    },
    [loadDocuments, loadHistory],
  );

  useEffect(() => {
    if (!studentId || !instituteId) return undefined;

    let ignore = false;

    const loadInitialData = async () => {
      const [documentsResult, historyResult] = await Promise.allSettled([
        handoverApi.listStudentDocuments(studentId, instituteId),
        handoverApi.listHistory(studentId, instituteId),
      ]);

      if (ignore) return;

      if (documentsResult.status === 'fulfilled') {
        setDocuments(documentsResult.value?.documents ?? []);
        setError('');
      } else {
        setError(getErrorMessage(documentsResult.reason));
      }

      if (historyResult.status === 'fulfilled') {
        setHistory(historyResult.value?.rows ?? []);
      } else {
        setHistory([]);
      }

      setLoading(false);
      setHistoryLoading(false);
    };

    void loadInitialData();

    return () => {
      ignore = true;
    };
  }, [studentId, instituteId]);

  const eligibleDocuments = documents.filter((document) => document.isEligibleForHandover);

  const handleDocumentSelect = (documentId) => {
    setSelectedDocuments((previous) =>
      previous.includes(documentId)
        ? previous.filter((id) => id !== documentId)
        : [...previous, documentId],
    );
  };

  const resetHandoverForm = () => {
    setSelectedDocuments([]);
    setReceiverName(student?.name ?? '');
    setReceiverMobile(student?.mobile ?? '');
    setReceiverPhoto(null);
    setSignedReceipt(null);
  };

  const handleOpenHandover = () => {
    resetHandoverForm();
    setHandoverOpen(true);
  };

  const handleCloseHandover = () => {
    if (submitting) return;

    setHandoverOpen(false);
    resetHandoverForm();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      notify.error('Receiver photo must be JPG or PNG.');
      event.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify.error('Receiver photo must not exceed 2 MB.');
      event.target.value = '';
      return;
    }

    setReceiverPhoto(file);
    event.target.value = '';
  };

  const handleSignatureChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      notify.error('Signature must be JPG, PNG, WEBP or PDF.');
      event.target.value = '';
      return;
    }

    const maxSize = file.type === 'application/pdf' ? 5 * 1024 * 1024 : 2 * 1024 * 1024;

    if (file.size > maxSize) {
      notify.error(
        file.type === 'application/pdf'
          ? 'PDF must not exceed 5 MB.'
          : 'Signature image must not exceed 2 MB.',
      );

      event.target.value = '';
      return;
    }

    setSignedReceipt(file);
    event.target.value = '';
  };

  const handleSubmitHandover = async () => {
    if (selectedDocuments.length === 0) {
      notify.error('Please select at least one document.');
      return;
    }

    if (!receiverName.trim()) {
      notify.error('Receiver name is required.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(receiverMobile.trim())) {
      notify.error('Enter a valid 10-digit mobile number.');
      return;
    }

    if (!receiverPhoto) {
      notify.error('Receiver photo is required.');
      return;
    }

    if (!signedReceipt) {
      notify.error('Signed receipt is required.');
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Upload receiver photo
      const photoResult = await handoverApi.uploadReceiverPhoto(
        studentId,
        receiverPhoto,
        instituteId,
      );

      // Step 2: Upload signed receipt
      const signatureResult = await handoverApi.uploadSignature(
        studentId,
        signedReceipt,
        instituteId,
      );

      // Step 3: Submit hand-over
      const payload = {
        studentId,
        documentIds: selectedDocuments,
        receiverType: 'SELF',
        receiverName: receiverName.trim(),
        receiverMobile: receiverMobile.trim(),
        receiverPhotoId: photoResult.fileId,
        signedReceiptId: signatureResult.fileId,
      };

      await handoverApi.submit(payload, instituteId);

      notify.success('Hand-over completed successfully.');

      setHandoverOpen(false);
      resetHandoverForm();

      await refreshData();
    } catch (requestError) {
      notify.error(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (!instituteId) {
    return (
      <Alert severity="warning">
        Please select one institute before viewing student documents.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Documents heading */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Student Documents
          </Typography>

          <Typography variant="body2" color="text.secondary">
            View document status and manage student hand-over.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<RefreshOutlinedIcon />}
            onClick={refreshData}
            disabled={loading || historyLoading}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<AssignmentTurnedInOutlinedIcon />}
            onClick={handleOpenHandover}
            disabled={!canIssueHandover || eligibleDocuments.length === 0 || loading}
          >
            Hand-over Documents
          </Button>
        </Stack>
      </Box>

      {!canIssueHandover && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You do not have permission to issue student documents.
        </Alert>
      )}

      {/* Documents list */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Document Register
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadDocuments}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        ) : documents.length === 0 ? (
          <Alert severity="info">No document records are available for this student.</Alert>
        ) : (
          <Stack spacing={1.5}>
            {documents.map((document) => (
              <Paper key={document.documentId} variant="outlined" sx={{ p: 2 }}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  gap={2}
                  flexWrap="wrap"
                >
                  <Box sx={{ flex: 1, minWidth: 180 }}>
                    <Typography fontWeight={600}>{document.documentName}</Typography>

                    <Typography variant="body2" color="text.secondary">
                      Type: {document.documentType || '—'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Document Number: {document.documentNumber || '—'}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Issue Date: {formatDate(document.issueDate)}
                    </Typography>
                  </Box>

                  <Chip
                    label={document.status || 'Unknown'}
                    color={
                      document.status === 'In custody'
                        ? 'success'
                        : document.status === 'Issued'
                          ? 'info'
                          : 'default'
                    }
                    variant="outlined"
                  />
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Handover history */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
          Hand-over History
        </Typography>

        {historyLoading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Box>
        ) : history.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No hand-over history found for this student.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {history.map((item) => (
              <Box key={item.handoverId}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={1}>
                  <Typography fontWeight={600}>{item.receiverName}</Typography>

                  <Chip size="small" label={item.status} color="success" variant="outlined" />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Date: {formatDate(item.handoverDate)}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Issued by: {item.issuingStaffName || '—'}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Documents:{' '}
                  {item.documents
                    ?.map((document) => document.documentName)
                    .filter(Boolean)
                    .join(', ') || '—'}
                </Typography>

                <Divider sx={{ mt: 1.5 }} />
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Handover dialog */}
      <Dialog open={handoverOpen} onClose={handleCloseHandover} fullWidth maxWidth="sm">
        <DialogTitle>Hand-over Student Documents</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="info">
              Select one or more documents that are currently in custody.
            </Alert>

            <Typography fontWeight={600}>Select Documents</Typography>

            {eligibleDocuments.length === 0 ? (
              <Alert severity="warning">No documents are currently eligible for hand-over.</Alert>
            ) : (
              <Stack spacing={1}>
                {eligibleDocuments.map((document) => (
                  <Paper key={document.documentId} variant="outlined" sx={{ px: 1.5, py: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedDocuments.includes(document.documentId)}
                          onChange={() => handleDocumentSelect(document.documentId)}
                        />
                      }
                      label={
                        <Box>
                          <Typography fontWeight={500}>{document.documentName}</Typography>

                          <Typography variant="caption" color="text.secondary">
                            {document.documentType}
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>
                ))}
              </Stack>
            )}

            <Divider />

            <Typography fontWeight={600}>Receiver Details</Typography>

            <TextField
              label="Receiver Name"
              value={receiverName}
              onChange={(event) => setReceiverName(event.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Receiver Mobile"
              value={receiverMobile}
              onChange={(event) => setReceiverMobile(event.target.value)}
              fullWidth
              required
              inputProps={{ maxLength: 10 }}
            />

            <Divider />

            <Typography fontWeight={600}>Receiver Photo</Typography>

            <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
              Upload Receiver Photo
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png"
                onChange={handlePhotoChange}
              />
            </Button>

            {receiverPhoto && (
              <Typography variant="body2" color="success.main">
                {receiverPhoto.name} ({formatFileSize(receiverPhoto.size)})
              </Typography>
            )}

            <Typography fontWeight={600}>Signed Receipt / Signature</Typography>

            <Button component="label" variant="outlined" startIcon={<UploadFileOutlinedIcon />}>
              Upload Signed Receipt
              <input
                hidden
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleSignatureChange}
              />
            </Button>

            {signedReceipt && (
              <Typography variant="body2" color="success.main">
                {signedReceipt.name} ({formatFileSize(signedReceipt.size)})
              </Typography>
            )}

            <Alert severity="warning">
              Once submitted, selected documents will be marked as Issued. This hand-over cannot be
              edited or deleted.
            </Alert>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseHandover} disabled={submitting}>
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleSubmitHandover}
            disabled={
              submitting || selectedDocuments.length === 0 || !receiverPhoto || !signedReceipt
            }
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Complete Hand-over'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentDocumentsTab;
