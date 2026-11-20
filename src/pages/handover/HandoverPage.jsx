import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';

import { handoverApi } from '@/api/handover';
import { studentsApi } from '@/api/students';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import FormTextField from '@/components/form/FormTextField';
import PageHeader from '@/components/PageHeader';
import StatusChip from '@/components/StatusChip';
import { DOCUMENT_STATUSES } from '@/constants/statuses';
import { useList } from '@/hooks/useList';
import { useNotify } from '@/hooks/useNotify';
import { useRequest } from '@/hooks/useRequest';

import HandoverHistory from './HandoverHistory';

const MB = 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const EMPTY_RECEIVER = { receiverName: '', mobile: '' };

// Hand-over of documents to the student (SRS HND-02, HND-03, HND-04, HND-06).
// Only a "Self" hand-over for now: the authorised-person affidavit is Phase 2 (HND-05).
// The server sets the date, time and issuing staff.
const HandoverPage = () => {
  const notify = useNotify();
  const latestStudentId = useRef(null);

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [signedReceipt, setSignedReceipt] = useState(null);
  const [pending, setPending] = useState(null);

  // Receiver photo preview
  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);
  const form = useForm({ defaultValues: EMPTY_RECEIVER });

  const receiverName = useWatch({ control: form.control, name: 'receiverName' }) ?? '';

  const receiverMobile = useWatch({ control: form.control, name: 'mobile' }) ?? '';

  // Signed receipt preview
  const signedReceiptPreview = useMemo(
    () => (signedReceipt?.type.startsWith('image/') ? URL.createObjectURL(signedReceipt) : ''),
    [signedReceipt],
  );

  useEffect(() => {
    return () => {
      if (signedReceiptPreview) {
        URL.revokeObjectURL(signedReceiptPreview);
      }
    };
  }, [signedReceiptPreview]);

  const {
    rows: studentRows,
    loading: studentsLoading,
    error: studentsError,
    params: studentParams,
    setParams: setStudentParams,
    reload: reloadStudents,
  } = useList(studentsApi.list, { page: 1, limit: 10, search: '' });

  const documentsRequest = useRequest(handoverApi.listDocuments);
  const createRequest = useRequest(handoverApi.create);

  // Only documents in custody can be handed over
  const availableDocuments = documents.filter(
    (document) => document.status === DOCUMENT_STATUSES.IN_CUSTODY,
  );

  const missing = [];

  if (!selectedStudent) {
    missing.push('select a student');
  } else {
    if (selectedDocumentIds.length === 0) {
      missing.push('select at least one document');
    }

    if (!receiverName.trim()) {
      missing.push('enter the receiver name');
    }

    if (!receiverMobile.trim()) {
      missing.push('enter the mobile number');
    } else if (!MOBILE_PATTERN.test(receiverMobile.trim())) {
      missing.push('enter a valid 10-digit mobile number');
    }

    if (!photo) {
      missing.push('add the receiver photo');
    }

    if (!signedReceipt) {
      missing.push('upload the signed receipt');
    }
  }

  const loadDocuments = async (student) => {
    latestStudentId.current = student._id;

    try {
      const { rows } = await documentsRequest.run(student._id, student.instituteId);

      if (latestStudentId.current === student._id) {
        setDocuments(rows);
      }
    } catch {
      // The error is shown by documentsRequest.error below, with a Retry button
    }
  };

  const resetPage = () => {
    latestStudentId.current = null;
    setSearch('');
    setStudentParams({ search: '' });
    setSelectedStudent(null);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setPhoto(null);
    setSignedReceipt(null);
    form.reset(EMPTY_RECEIVER);
  };

  const handleSearch = () => {
    latestStudentId.current = null;
    setSelectedStudent(null);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setPhoto(null);
    setSignedReceipt(null);
    setStudentParams({ search: search.trim() });
  };

  const handleStudentSelection = (student) => {
    setSelectedStudent(student);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setPhoto(null);
    setSignedReceipt(null);

    form.reset({
      receiverName: student.name || '',
      mobile: student.mobile || '',
    });

    loadDocuments(student);
  };

  const handleDocumentSelection = (documentId) => {
    setSelectedDocumentIds((previous) =>
      previous.includes(documentId)
        ? previous.filter((id) => id !== documentId)
        : [...previous, documentId],
    );
  };

  const handleSelectAll = (event) => {
    setSelectedDocumentIds(
      event.target.checked ? availableDocuments.map((item) => item.documentId) : [],
    );
  };

  // Same limits as the server: images up to 2 MB, PDFs up to 5 MB
  const pickFile = (event, { allowPdf, onPick }) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const isPdf = file.type === 'application/pdf';

    if (!IMAGE_TYPES.includes(file.type) && !(allowPdf && isPdf)) {
      notify.error(
        allowPdf
          ? 'Only JPG, PNG, WEBP or PDF files are allowed'
          : 'Only JPG or PNG images are allowed',
      );
      return;
    }

    if (file.size > (isPdf ? 5 * MB : 2 * MB)) {
      notify.error(isPdf ? 'PDF must be 5 MB or smaller' : 'Image must be 2 MB or smaller');
      return;
    }

    onPick(file);
  };

  const handleConfirm = async () => {
    try {
      if (!signedReceipt) {
        throw new Error('Please upload the signed receipt.');
      }

      // Step 1: Upload receiver photo
      const photoResponse = await handoverApi.uploadPhoto(
        selectedStudent._id,
        photo,
        selectedStudent.instituteId,
      );

      const receiverPhotoId = photoResponse?.fileId;

      if (!receiverPhotoId) {
        throw new Error('Receiver photo upload failed. File ID not received.');
      }

      // Step 2: Upload mandatory signed receipt
      const signatureResponse = await handoverApi.uploadSignature(
        selectedStudent._id,
        signedReceipt,
        selectedStudent.instituteId,
      );

      const signedReceiptId = signatureResponse?.fileId;

      if (!signedReceiptId) {
        throw new Error('Signed receipt upload failed. File ID not received.');
      }

      // Step 3: Submit handover using uploaded file IDs
      const handoverData = {
        studentId: selectedStudent._id,
        documentIds: selectedDocumentIds,
        receiverType: 'SELF',
        receiverName: pending.receiverName.trim(),
        receiverMobile: pending.mobile.trim(),
        receiverPhotoId,
        signedReceiptId,
      };

      await createRequest.run(handoverData, selectedStudent.instituteId);

      notify.success('Hand-over completed');
      resetPage();
    } catch (error) {
      notify.error(error);
    } finally {
      setPending(null);
    }
  };

  return (
    <FormProvider {...form}>
      <Box>
        <PageHeader
          title="Hand-over"
          subtitle="Manage and record student document handovers"
          backTo="/"
        />

        <Paper sx={{ mt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_event, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Handover sections"
          >
            <Tab label="Hand-over Form" />
            <Tab label="Handover History" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <Stack spacing={3}>
                {/* Student Search */}
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <PersonOutlineOutlinedIcon color="primary" />
                    <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
                      Student Details
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search Student"
                      placeholder="Enter name, scholar number or roll number"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSearch();
                      }}
                    />

                    <Button
                      variant="contained"
                      startIcon={<SearchOutlinedIcon />}
                      disabled={!search.trim() || studentsLoading}
                      onClick={handleSearch}
                      sx={{ minWidth: 130 }}
                    >
                      {studentsLoading ? 'Searching...' : 'Search'}
                    </Button>
                  </Stack>

                  {studentParams.search && (
                    <Box sx={{ mt: 2 }}>
                      {studentsLoading ? (
                        <Alert severity="info">Searching students...</Alert>
                      ) : studentsError ? (
                        <ErrorState error={studentsError} onRetry={reloadStudents} />
                      ) : studentRows.length > 0 ? (
                        <>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Search Results
                          </Typography>

                          <Stack spacing={1}>
                            {studentRows.map((student) => (
                              <Paper
                                key={student._id}
                                variant="outlined"
                                sx={{
                                  p: 2,
                                  borderColor:
                                    selectedStudent?._id === student._id
                                      ? 'primary.main'
                                      : 'divider',
                                }}
                              >
                                <Button
                                  fullWidth
                                  onClick={() => handleStudentSelection(student)}
                                  sx={{
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    textTransform: 'none',
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {student.name}
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'text.secondary',
                                        display: 'block',
                                      }}
                                    >
                                      Scholar No: {student.scholarNo || 'N/A'}
                                      {' | '}
                                      Enrollment No: {student.enrollmentNo || 'N/A'}
                                    </Typography>

                                    <Typography
                                      variant="caption"
                                      sx={{
                                        color: 'text.secondary',
                                        display: 'block',
                                      }}
                                    >
                                      Roll No: {student.rollNo || 'N/A'}
                                      {' | '}
                                      Mobile: {student.mobile || 'N/A'}
                                    </Typography>
                                  </Box>
                                </Button>
                              </Paper>
                            ))}
                          </Stack>
                        </>
                      ) : (
                        <Alert severity="warning">No students found for this search.</Alert>
                      )}
                    </Box>
                  )}

                  {selectedStudent && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Selected Student: <strong>{selectedStudent.name}</strong>
                      <br />
                      Enrollment No: {selectedStudent.enrollmentNo || 'N/A'}
                    </Alert>
                  )}
                </Paper>

                {/* Documents for hand-over */}
                <Paper sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <DescriptionOutlinedIcon color="primary" />
                      <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
                        Documents for Hand-over
                      </Typography>
                    </Box>

                    <Chip
                      label={`Selected: ${selectedDocumentIds.length}`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </Box>

                  {!selectedStudent ? (
                    <Alert severity="info">
                      Search and select a student to see the documents in custody.
                    </Alert>
                  ) : documentsRequest.loading ? (
                    <Stack spacing={1}>
                      <Skeleton variant="rounded" height={56} />
                      <Skeleton variant="rounded" height={56} />
                    </Stack>
                  ) : documentsRequest.error ? (
                    <ErrorState
                      error={documentsRequest.error}
                      onRetry={() => loadDocuments(selectedStudent)}
                    />
                  ) : availableDocuments.length === 0 ? (
                    <Alert severity="info">
                      This student has no documents in custody to hand over.
                    </Alert>
                  ) : (
                    <>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedDocumentIds.length === availableDocuments.length}
                            indeterminate={
                              selectedDocumentIds.length > 0 &&
                              selectedDocumentIds.length < availableDocuments.length
                            }
                            onChange={handleSelectAll}
                          />
                        }
                        label="Select all documents"
                      />

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1}>
                        {availableDocuments.map((document) => (
                          <Paper key={document.documentId} variant="outlined" sx={{ p: 2 }}>
                            <FormControlLabel
                              sx={{
                                m: 0,
                                width: '100%',
                                alignItems: 'center',
                                '& .MuiFormControlLabel-label': {
                                  flex: 1,
                                  minWidth: 0,
                                },
                              }}
                              control={
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ width: '100%' }}
                                >
                                  <Checkbox
                                    checked={selectedDocumentIds.includes(document.documentId)}
                                    onChange={() => handleDocumentSelection(document.documentId)}
                                  />

                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body1">
                                      {document.documentName || document.documentType}
                                    </Typography>

                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {document.documentType}
                                    </Typography>
                                  </Box>

                                  <StatusChip
                                    status={document.status}
                                    color="primary"
                                    variant="outlined"
                                  />
                                </Stack>
                              }
                            />
                          </Paper>
                        ))}
                      </Stack>
                    </>
                  )}
                </Paper>

                {/* Receiver Details */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Receiver Details
                  </Typography>

                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Receiver type: Self (the student collects the documents).
                  </Typography>

                  <Stack spacing={2}>
                    <FormTextField
                      name="receiverName"
                      label="Receiver Name"
                      size="small"
                      fullWidth
                      helperText={
                        !receiverName.trim() ? (
                          <span style={{ color: '#d32f2f' }}>Mandatory field</span>
                        ) : (
                          ''
                        )
                      }
                      disabled={!selectedStudent}
                      rules={{
                        required: 'Enter the receiver name',
                        validate: (value) =>
                          Boolean(String(value ?? '').trim()) || 'Enter the receiver name',
                      }}
                    />

                    <FormTextField
                      name="mobile"
                      label="Mobile Number"
                      type="tel"
                      size="small"
                      fullWidth
                      helperText={
                        !receiverMobile.trim() ? (
                          <span style={{ color: '#d32f2f' }}>Mandatory field</span>
                        ) : (
                          ''
                        )
                      }
                      disabled={!selectedStudent}
                      rules={{
                        required: 'Enter the mobile number',
                        validate: (value) => {
                          const mobile = String(value ?? '').trim();

                          if (!mobile) {
                            return 'Enter the mobile number';
                          }

                          return (
                            MOBILE_PATTERN.test(mobile) || 'Enter a valid 10-digit mobile number'
                          );
                        },
                      }}
                    />
                  </Stack>
                </Paper>

                {/* Receiver Photo */}
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <CameraAltOutlinedIcon color="primary" />
                    <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
                      Receiver Photo
                    </Typography>
                  </Stack>

                  <Button variant="outlined" component="label" disabled={!selectedStudent}>
                    Capture / Upload Photo
                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png"
                      capture="user"
                      onChange={(event) =>
                        pickFile(event, {
                          allowPdf: false,
                          onPick: setPhoto,
                        })
                      }
                    />
                  </Button>

                  {photo && (
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                      <Box
                        component="img"
                        src={photoPreview}
                        alt="Receiver photo preview"
                        sx={{
                          width: 180,
                          height: 180,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      />

                      <Typography variant="body2" color="text.secondary">
                        Selected: {photo.name}
                      </Typography>

                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setPhoto(null)}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Remove Photo
                      </Button>
                    </Stack>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mt: 1,
                    }}
                  >
                    Receiver photo is mandatory to complete the hand-over. JPG or PNG, up to 2 MB.
                  </Typography>
                </Paper>

                {/* Signed Receipt */}
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <DrawOutlinedIcon color="primary" />
                    <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
                      Signed Receipt
                    </Typography>
                  </Stack>

                  <Button variant="outlined" component="label" disabled={!selectedStudent}>
                    Upload Signed Receipt
                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={(event) =>
                        pickFile(event, {
                          allowPdf: true,
                          onPick: setSignedReceipt,
                        })
                      }
                    />
                  </Button>

                  {signedReceipt && (
                    <Stack spacing={1.5} sx={{ mt: 2 }}>
                      {signedReceipt.type.startsWith('image/') ? (
                        <Box
                          component="img"
                          src={signedReceiptPreview}
                          alt="Signed receipt preview"
                          sx={{
                            width: 180,
                            height: 180,
                            objectFit: 'contain',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2" color="primary">
                            PDF Document
                          </Typography>
                        </Box>
                      )}

                      <Typography variant="body2" color="text.secondary">
                        Selected: {signedReceipt.name}
                      </Typography>

                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => setSignedReceipt(null)}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        Remove Receipt
                      </Button>
                    </Stack>
                  )}

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mt: 1,
                    }}
                  >
                    Image up to 2 MB or PDF up to 5 MB.
                  </Typography>
                </Paper>

                {/* Summary */}
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6">Handover Summary</Typography>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1}>
                    <Typography variant="body2">
                      Student: {selectedStudent?.name || 'Not selected'}
                    </Typography>

                    <Typography variant="body2">
                      Receiver Name: {receiverName.trim() || 'Pending'}
                    </Typography>

                    <Typography variant="body2">
                      Mobile Number: {receiverMobile.trim() || 'Pending'}
                    </Typography>

                    <Typography variant="body2">
                      Selected Documents: {selectedDocumentIds.length}
                    </Typography>

                    <Typography variant="body2">Photo: {photo ? 'Selected' : 'Pending'}</Typography>

                    <Typography variant="body2">
                      Signed Receipt: {signedReceipt ? 'Selected' : 'Not added'}
                    </Typography>
                  </Stack>

                  {missing.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Still needed: {missing.join(', ')}.
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    fullWidth
                    disabled={missing.length > 0}
                    onClick={form.handleSubmit(setPending)}
                    sx={{ mt: 3 }}
                  >
                    Complete Hand-over
                  </Button>

                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      display: 'block',
                      mt: 1,
                    }}
                  >
                    A hand-over cannot be edited or deleted after it is saved.
                  </Typography>
                </Paper>
              </Stack>
            )}

            {activeTab === 1 && <HandoverHistory />}
          </Box>
        </Paper>

        <ConfirmDialog
          open={Boolean(pending)}
          title="Complete hand-over?"
          message={`Hand over ${selectedDocumentIds.length} document(s) of ${
            selectedStudent?.name ?? ''
          } to ${pending?.receiverName?.trim() ?? ''}? This cannot be undone.`}
          confirmLabel="Complete hand-over"
          loading={createRequest.loading}
          onConfirm={handleConfirm}
          onClose={() => setPending(null)}
        />
      </Box>
    </FormProvider>
  );
};

export default HandoverPage;
