import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';

const getStatusColor = (status) => {
  switch (status) {
    case 'CLEAR':
      return 'success';
    case 'NOT_CLEAR':
      return 'error';
    default:
      return 'warning';
  }
};

export default function DepartmentQueue({
  items = [],
  onStatusChange,
  onUpdateDues,
  loading = false,
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [remark, setRemark] = useState('');
  const [dues, setDues] = useState({});

  const handleOpenNotClear = (item) => {
    setSelectedItem(item);
    setRemark('');
  };

  const handleCloseNotClear = () => {
    setSelectedItem(null);
    setRemark('');
  };

  const handleSubmitNotClear = () => {
    const reason = remark.trim();

    if (!reason || !selectedItem || !onStatusChange) return;

    onStatusChange(selectedItem, 'NOT_CLEAR', reason);
    handleCloseNotClear();
  };

  const handleAmountChange = (itemId, value) => {
    setDues((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleUpdateAmount = (item) => {
    const amountDue = dues[item._id] ?? String(item.amountDue ?? 0);
    const parsedAmount = Number(amountDue);

    if (amountDue === '' || !Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return;
    }

    onUpdateDues?.(item, {
      amountDue: parsedAmount,
      remark: item.remark ?? '',
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Department Clearance Queue
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Review student clearance requests assigned to your department.
        </Typography>
      </Box>

      <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
        <Table
          sx={{
            tableLayout: 'fixed',
            minWidth: 1120,
          }}
        >
          <colgroup>
            <col style={{ width: '190px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '260px' }} />
            <col style={{ width: '220px' }} />
          </colgroup>

          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Student</strong>
              </TableCell>

              <TableCell>
                <strong>Department</strong>
              </TableCell>

              <TableCell>
                <strong>Status</strong>
              </TableCell>

              <TableCell>
                <strong>Remark</strong>
              </TableCell>

              <TableCell>
                <strong>Amount Due</strong>
              </TableCell>

              <TableCell align="center">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No clearance requests available.</Typography>
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>
                  {item.student?.name ||
                    item.studentName ||
                    item.student?.scholarNo ||
                    item.studentId ||
                    '—'}
                </TableCell>

                <TableCell>{item.departmentName || '—'}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={item.status || 'PENDING'}
                    color={getStatusColor(item.status)}
                  />
                </TableCell>

                <TableCell>{item.remark || '—'}</TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                    <TextField
                      size="small"
                      type="number"
                      value={dues[item._id] ?? item.amountDue ?? 0}
                      onChange={(event) => handleAmountChange(item._id, event.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      sx={{ width: 110 }}
                    />

                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!onUpdateDues}
                      onClick={() => handleUpdateAmount(item)}
                    >
                      Update
                    </Button>
                  </Stack>
                </TableCell>

                <TableCell align="center">
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="center"
                    alignItems="center"
                    sx={{ width: '100%', transform: 'translateX(25px)' }}
                  >
                    <Button
                      size="small"
                      color="success"
                      variant="outlined"
                      disabled={!onStatusChange}
                      onClick={() => onStatusChange(item, 'CLEAR')}
                    >
                      Clear
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={!onStatusChange}
                      onClick={() => handleOpenNotClear(item)}
                    >
                      Not Clear
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={Boolean(selectedItem)} onClose={handleCloseNotClear} fullWidth maxWidth="sm">
        <DialogTitle>Mark Clearance as Not Clear</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for marking this clearance as not clear.
          </Typography>

          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            placeholder="Enter reason for not clearing"
            value={remark}
            onChange={(event) => setRemark(event.target.value)}
            inputProps={{ maxLength: 500 }}
            required
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseNotClear}>Cancel</Button>

          <Button
            color="error"
            variant="contained"
            onClick={handleSubmitNotClear}
            disabled={!remark.trim()}
          >
            Confirm Not Clear
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
