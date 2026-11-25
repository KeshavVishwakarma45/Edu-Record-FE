import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { useNotify } from '@/hooks/useNotify';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Pagination,
  ClickAwayListener,
  Popper,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';

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
import { useRequest } from '@/hooks/useRequest';

import HandoverHistory from './HandoverHistory';

const MB = 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MOBILE_PATTERN = /^[6-9]\d{9}$/;
const EMPTY_RECEIVER = { receiverName: '', mobile: '' };

const HandoverPageContent = () => {
  const { selectedInstitute, allInstitutes } = useAuth();
  const notify = useNotify();
  const latestStudentId = useRef(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);

  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState('');
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [signedReceipt, setSignedReceipt] = useState(null);
  const [pending, setPending] = useState(null);
  const [handoverSubmitting, setHandoverSubmitting] = useState(false);

  const submissionInProgress = useRef(false);
  const uploadedPhotoId = useRef(null);
  const uploadedSignatureId = useRef(null);

  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo]);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const form = useForm({ defaultValues: EMPTY_RECEIVER });

  const receiverName =
    useWatch({
      control: form.control,
      name: 'receiverName',
    }) ?? '';

  const receiverMobile =
    useWatch({
      control: form.control,
      name: 'mobile',
    }) ?? '';

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
    total: studentTotal,
    loading: studentsLoading,
    error: studentsError,
    params: studentParams,
    setParams: setStudentParams,
    reload: reloadStudents,
  } = useList(studentsApi.list, {
    page: 1,
    limit: 10,
    search: '',
  });

  const studentTotalPages = Math.ceil(studentTotal / studentParams.limit);

  const documentsRequest = useRequest(handoverApi.listDocuments);
  const createRequest = useRequest(handoverApi.create);

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
      const { rows } = await documentsRequest.run(student._id, selectedInstitute.id);

      if (latestStudentId.current === student._id) {
        setDocuments(rows);
      }
    } catch {
      // Error is displayed through documentsRequest.error.
    }
  };

  const resetPage = () => {
    latestStudentId.current = null;
    uploadedPhotoId.current = null;
    uploadedSignatureId.current = null;

    setSearch('');
    setStudentDialogOpen(false);
    setStudentParams({ search: '' });
    setSelectedStudent(null);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setPhoto(null);
    setSignedReceipt(null);

    form.reset(EMPTY_RECEIVER);
    setPending(null);
  };

  // Live search with compact dropdown.
  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearch(value);
    setStudentDialogOpen(Boolean(value.trim()));

    latestStudentId.current = null;
    uploadedPhotoId.current = null;
    uploadedSignatureId.current = null;

    setSelectedStudent(null);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setPhoto(null);
    setSignedReceipt(null);

    form.reset(EMPTY_RECEIVER);

    setStudentParams({
      search: value.trim(),
    });
  };

  const handleStudentSelection = (student) => {
    if (allInstitutes || !selectedInstitute?.id) {
      notify.error('Please select one institute first');
      return;
    }

    uploadedPhotoId.current = null;
    uploadedSignatureId.current = null;

    setSelectedStudent(student);
    setStudentDialogOpen(false);

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
    if (submissionInProgress.current || !pending || !selectedStudent) return;

    if (allInstitutes || !selectedInstitute?.id) {
      notify.error('Please select one institute first');
      return;
    }
    submissionInProgress.current = true;
    setHandoverSubmitting(true);

    try {
      if (!photo || !signedReceipt) {
        throw new Error('Please upload the receiver photo and signed receipt.');
      }

      if (!uploadedPhotoId.current) {
        const photoResponse = await handoverApi.uploadPhoto(
          selectedStudent._id,
          photo,
          selectedInstitute.id,
        );

        if (!photoResponse?.fileId) {
          throw new Error('Receiver photo upload failed. File ID not received.');
        }

        uploadedPhotoId.current = photoResponse.fileId;
      }

      if (!uploadedSignatureId.current) {
        const signatureResponse = await handoverApi.uploadSignature(
          selectedStudent._id,
          signedReceipt,
          selectedInstitute.id,
        );

        if (!signatureResponse?.fileId) {
          throw new Error('Signed receipt upload failed. File ID not received.');
        }

        uploadedSignatureId.current = signatureResponse.fileId;
      }

      const handoverData = {
        studentId: selectedStudent._id,
        documentIds: selectedDocumentIds,
        receiverType: 'SELF',
        receiverName: pending.receiverName.trim(),
        receiverMobile: pending.mobile.trim(),
        receiverPhotoId: uploadedPhotoId.current,
        signedReceiptId: uploadedSignatureId.current,
      };

      await createRequest.run(handoverData, selectedInstitute.id);

      notify.success('Hand-over completed');
      resetPage();
    } catch (error) {
      notify.error(error);
    } finally {
      submissionInProgress.current = false;
      setHandoverSubmitting(false);
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
                <Paper sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <PersonOutlineOutlinedIcon color="primary" />
                    <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
                      Student Details
                    </Typography>
                  </Stack>

                  <Box ref={setSearchAnchorEl}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Search Student"
                      placeholder="Enter name, scholar number or roll number"
                      value={search}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (search.trim() && !selectedStudent) {
                          setStudentDialogOpen(true);
                        }
                      }}
                    />
                  </Box>

                  {selectedStudent && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Selected Student: <strong>{selectedStudent.name}</strong>
                      <br />
                      Enrollment No: {selectedStudent.enrollmentNo || 'N/A'}
                    </Alert>
                  )}
                </Paper>

                {/* Compact Student Search Dropdown */}
                <Popper
                  open={studentDialogOpen}
                  anchorEl={searchAnchorEl}
                  placement="bottom-start"
                  disablePortal={false}
                  modifiers={[
                    {
                      name: 'offset',
                      options: {
                        offset: [0, 6],
                      },
                    },
                    {
                      name: 'flip',
                      enabled: false,
                    },
                    {
                      name: 'preventOverflow',
                      options: {
                        padding: 16,
                      },
                    },
                  ]}
                  sx={{
                    zIndex: (theme) => theme.zIndex.modal,
                    width: searchAnchorEl?.clientWidth || 'auto',
                    maxWidth: 760,
                  }}
                >
                  <ClickAwayListener
                    onClickAway={(event) => {
                      if (searchAnchorEl?.contains(event.target)) {
                        return;
                      }

                      setStudentDialogOpen(false);
                    }}
                  >
                    <Paper
                      elevation={6}
                      sx={{
                        width: '100%',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Box sx={{ px: 1.5, py: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          Search Results
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          {studentsLoading
                            ? 'Searching students...'
                            : `${studentTotal} students found`}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box sx={{ p: 1 }}>
                        {studentsLoading ? (
                          <Stack spacing={0.75}>
                            <Skeleton variant="rounded" height={48} />
                            <Skeleton variant="rounded" height={48} />
                          </Stack>
                        ) : studentsError ? (
                          <ErrorState error={studentsError} onRetry={reloadStudents} />
                        ) : studentRows.length > 0 ? (
                          <>
                            <Stack
                              spacing={0.75}
                              sx={{
                                maxHeight: 320,
                                overflowY: 'auto',
                                pr: 0.5,
                              }}
                            >
                              {studentRows.map((student) => (
                                <Paper
                                  key={student._id}
                                  variant="outlined"
                                  sx={{
                                    p: 0.5,
                                    borderColor: 'divider',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                      bgcolor: 'action.hover',
                                    },
                                  }}
                                >
                                  <Button
                                    fullWidth
                                    size="small"
                                    onClick={() => handleStudentSelection(student)}
                                    sx={{
                                      justifyContent: 'flex-start',
                                      textAlign: 'left',
                                      textTransform: 'none',
                                      py: 0.5,
                                      px: 0.75,
                                      minHeight: 'auto',
                                    }}
                                  >
                                    <Box sx={{ minWidth: 0, width: '100%' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {student.name}
                                      </Typography>

                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        Scholar No: {student.scholarNo || 'N/A'}
                                        {' | '}
                                        Enrollment No: {student.enrollmentNo || 'N/A'}
                                      </Typography>

                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
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

                            {studentTotalPages > 1 && (
                              <Pagination
                                count={studentTotalPages}
                                page={studentParams.page}
                                onChange={(_event, page) => setStudentParams({ page })}
                                color="primary"
                                size="small"
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  mt: 1,
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <Alert severity="warning">No students found for this search.</Alert>
                        )}
                      </Box>
                    </Paper>
                  </ClickAwayListener>
                </Popper>

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
                          onPick: (file) => {
                            uploadedPhotoId.current = null;
                            setPhoto(file);
                          },
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
                        onClick={() => {
                          uploadedPhotoId.current = null;
                          setPhoto(null);
                        }}
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
                          onPick: (file) => {
                            uploadedSignatureId.current = null;
                            setSignedReceipt(file);
                          },
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
                        onClick={() => {
                          uploadedSignatureId.current = null;
                          setSignedReceipt(null);
                        }}
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
          loading={handoverSubmitting}
          onConfirm={handleConfirm}
          onClose={() => setPending(null)}
        />
      </Box>
    </FormProvider>
  );
};

const HandoverPage = () => {
  const { selectedInstitute } = useAuth();

  return <HandoverPageContent key={selectedInstitute?.id ?? 'no-institute'} />;
};

export default HandoverPage;
