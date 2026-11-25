import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

export default function AccountsDues({ items = [], onUpdateDues, loading = false }) {
  const [dues, setDues] = useState({});

  const handleChange = (id, field, value) => {
    setDues((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleUpdate = (item) => {
    const values = dues[item._id] || {};

    onUpdateDues?.(item, {
      amountDue: values.amountDue ?? item.amountDue ?? 0,
      remark: values.remark ?? item.remark ?? '',
    });
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Accounts — Pending Dues
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Review and update outstanding student dues.
        </Typography>
      </Box>

      <TableContainer>
        <Table>
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
                <strong>Amount Due (₹)</strong>
              </TableCell>
              <TableCell>
                <strong>Remark</strong>
              </TableCell>
              <TableCell>
                <strong>Action</strong>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {!loading && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No pending dues found.</Typography>
                </TableCell>
              </TableRow>
            )}

            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.studentName || item.studentId || '—'}</TableCell>

                <TableCell>{item.departmentName || 'Accounts'}</TableCell>

                <TableCell>
                  <Chip size="small" label={item.status || 'PENDING'} color="warning" />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={dues[item._id]?.amountDue ?? item.amountDue ?? 0}
                    onChange={(e) => handleChange(item._id, 'amountDue', e.target.value)}
                    sx={{ width: 120 }}
                  />
                </TableCell>

                <TableCell>
                  <TextField
                    size="small"
                    value={dues[item._id]?.remark ?? item.remark ?? ''}
                    onChange={(e) => handleChange(item._id, 'remark', e.target.value)}
                    placeholder="Enter remark"
                  />
                </TableCell>

                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={!onUpdateDues}
                    onClick={() => handleUpdate(item)}
                  >
                    Update
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
