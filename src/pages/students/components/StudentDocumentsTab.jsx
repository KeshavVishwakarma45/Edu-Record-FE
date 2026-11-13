import {
  Box,
  Paper,
  Typography,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const mockDocuments = [
  {
    id: 1,
    name: 'Semester 1 Marksheet',
    receivedDate: '15/06/2026',
    location: 'College Office',
    issuedDate: '20/06/2026',
    receiver: 'Rahul Sharma',
    photo: '',
  },
  {
    id: 2,
    name: '10th Marksheet',
    receivedDate: '10/07/2026',
    location: 'Admission Office',
    issuedDate: '15/07/2026',
    receiver: 'Rahul Sharma',
    photo: '',
  },
  {
    id: 3,
    name: '12th Marksheet',
    receivedDate: '12/07/2026',
    location: 'Admission Office',
    issuedDate: '18/07/2026',
    receiver: 'Rahul Sharma',
    photo: '',
  },
];

const StudentDocumentsTab = () => {
  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Student Documents
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Document Name</TableCell>
              <TableCell>Received Date</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Issued Date</TableCell>
              <TableCell>Receiver</TableCell>
              <TableCell>Photo</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {mockDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell>{document.name}</TableCell>
                <TableCell>{document.receivedDate}</TableCell>
                <TableCell>{document.location}</TableCell>
                <TableCell>{document.issuedDate}</TableCell>
                <TableCell>{document.receiver}</TableCell>

                <TableCell>
                  <Avatar
                    src={document.photo || undefined}
                    alt={document.receiver}
                    sx={{ width: 36, height: 36 }}
                  >
                    {document.receiver.charAt(0)}
                  </Avatar>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Chip label={`${mockDocuments.length} Documents`} variant="outlined" />
      </Box>
    </Box>
  );
};

export default StudentDocumentsTab;
