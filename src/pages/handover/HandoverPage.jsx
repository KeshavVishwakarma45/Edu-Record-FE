import { useState } from 'react';
import { useList } from '@/hooks/useList';
import { studentsApi } from '@/api/students';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined';

import PageHeader from '@/components/PageHeader';

const HandoverPage = () => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [receiverName, setReceiverName] = useState('');
  const [mobile, setMobile] = useState('');
  const [photo, setPhoto] = useState(null);
  const [signedReceipt, setSignedReceipt] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const {
    rows: studentRows,
    loading: studentsLoading,
    error: studentsError,
    params: studentParams,
    setParams: setStudentParams,
  } = useList(studentsApi.list, {
    page: 1,
    limit: 10,
    search: '',
  });

  const availableDocuments = documents.filter(
    (document) => document.status === 'Available' && document.isEligibleForHandover === true,
  );

  const handleSearch = () => {
    setSelectedStudent(null);
    setDocuments([]);
    setSelectedDocumentIds([]);
    setStudentParams({ search: search.trim() });
  };

  const handleStudentSelection = (student) => {
    setSelectedStudent(student);
    setReceiverName(student.name || '');
    setMobile(student.mobile || '');

    setDocuments([]);
    setSelectedDocumentIds([]);
    setPhoto(null);
    setSignedReceipt(null);
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
      event.target.checked ? availableDocuments.map((document) => document.documentId) : [],
    );
  };

  return (
    <Box>
      <PageHeader title="Hand-over" subtitle="Manage and record student document handovers" />

      <Stack spacing={3} sx={{ mt: 3 }}>
        {/* Student Search */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
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
                if (event.key === 'Enter') {
                  handleSearch();
                }
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
                <Alert severity="error">Unable to load students. Please try again.</Alert>
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
                            selectedStudent?._id === student._id ? 'primary.main' : 'divider',
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
                            <Typography variant="body1" fontWeight={600}>
                              {student.name}
                            </Typography>

                            <Typography variant="caption" color="text.secondary" display="block">
                              Scholar No: {student.scholarNo || 'N/A'}
                              {' | '}
                              Enrollment No: {student.enrollmentNo || 'N/A'}
                            </Typography>

                            <Typography variant="caption" color="text.secondary" display="block">
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

        {/* Available Documents */}
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

          {selectedStudent ? (
            availableDocuments.length > 0 ? (
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
                  label="Select All Available Documents"
                />

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  {documents.map((document) => {
                    const isAvailable =
                      document.status === 'Available' && document.isEligibleForHandover === true;

                    return (
                      <Paper key={document.documentId} variant="outlined" sx={{ p: 2 }}>
                        <FormControlLabel
                          sx={{
                            m: 0,
                            width: '100%',
                            alignItems: 'center',
                          }}
                          control={
                            <Checkbox
                              checked={selectedDocumentIds.includes(document.documentId)}
                              disabled={!isAvailable}
                              onChange={() => handleDocumentSelection(document.documentId)}
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body1">{document.documentName}</Typography>

                              <Typography variant="caption" color="text.secondary">
                                {document.documentType} | Status: {document.status}
                              </Typography>
                            </Box>
                          }
                        />
                      </Paper>
                    );
                  })}
                </Stack>
              </>
            ) : (
              <Alert severity="info">
                No document data is available for this student yet. Document listing will be
                connected after the document API is available.
              </Alert>
            )
          ) : (
            <Alert severity="info">
              Search and select a student to view their available documents.
            </Alert>
          )}
        </Paper>

        {/* Receiver Details */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Receiver Details
          </Typography>

          <Stack spacing={2}>
            <TextField fullWidth size="small" label="Receiver Type" value="Self" disabled />

            <TextField
              fullWidth
              size="small"
              label="Receiver Name"
              value={receiverName}
              onChange={(event) => setReceiverName(event.target.value)}
              disabled={!selectedStudent}
            />

            <TextField
              fullWidth
              size="small"
              label="Mobile Number"
              value={mobile}
              onChange={(event) => setMobile(event.target.value)}
              disabled={!selectedStudent}
            />
          </Stack>
        </Paper>

        {/* Receiver Photo */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
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
              onChange={(event) => {
                setPhoto(event.target.files?.[0] || null);
              }}
            />
          </Button>

          {photo && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: {photo.name}
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Receiver photo is mandatory to complete handover.
          </Typography>
        </Paper>

        {/* Signature / Signed Receipt */}
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <DrawOutlinedIcon color="primary" />

            <Typography variant="h6" sx={{ lineHeight: 1.4 }}>
              Signature / Signed Receipt
            </Typography>
          </Stack>

          <Button variant="outlined" component="label" disabled={!selectedStudent}>
            Upload Signed Receipt
            <input
              hidden
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(event) => {
                setSignedReceipt(event.target.files?.[0] || null);
              }}
            />
          </Button>

          {signedReceipt && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: {signedReceipt.name}
            </Typography>
          )}
        </Paper>

        {/* Handover Summary */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Handover Summary</Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Typography variant="body2">
              Student: {selectedStudent?.name || 'Not selected'}
            </Typography>

            <Typography variant="body2">Receiver: {receiverName || 'Not entered'}</Typography>

            <Typography variant="body2">Mobile: {mobile || 'Not entered'}</Typography>

            <Typography variant="body2">
              Selected Documents: {selectedDocumentIds.length}
            </Typography>

            <Typography variant="body2">Photo: {photo ? 'Selected' : 'Pending'}</Typography>

            <Typography variant="body2">
              Signed Receipt: {signedReceipt ? 'Selected' : 'Pending'}
            </Typography>
          </Stack>

          <Button variant="contained" fullWidth disabled sx={{ mt: 3 }}>
            Complete Hand-over
          </Button>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Submission will be enabled after backend integration.
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
};

export default HandoverPage;
