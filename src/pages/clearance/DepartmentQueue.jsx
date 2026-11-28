import { useState } from 'react';

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

export default function DepartmentQueue({
  items = [],
  onStatusChange,
  onAmountDueChange,
  pendingCount = 0,
  loading = false,

  // Server-side pagination props
  serverPagination = false,
  currentPage = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
}) {
  // Remark dialog state
  const [selectedItem, setSelectedItem] = useState(null);
  const [remark, setRemark] = useState('');

  // Search and filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Local pagination state
  const [localPage, setLocalPage] = useState(0);
  const [localLimit, setLocalLimit] = useState(10);

  const page = serverPagination ? currentPage - 1 : localPage;
  const limit = serverPagination ? pageSize : localLimit;

  // Amount Due dialog state
  const [amountItem, setAmountItem] = useState(null);
  const [amountDue, setAmountDue] = useState('');
  const [amountError, setAmountError] = useState('');
  const [savingAmount, setSavingAmount] = useState(false);

  // Open NOT_CLEAR dialog
  const handleOpenRemarkDialog = (item) => {
    setSelectedItem(item);
    setRemark('');
  };

  // Close NOT_CLEAR dialog
  const handleCloseRemarkDialog = () => {
    setSelectedItem(null);
    setRemark('');
  };

  // Submit NOT_CLEAR
  const handleSubmitNotClear = () => {
    if (!selectedItem || !remark.trim()) return;

    onStatusChange?.(selectedItem, 'NOT_CLEAR', remark.trim());
    handleCloseRemarkDialog();
  };

  // Open Amount Due dialog
  const handleOpenAmountDialog = (item) => {
    setAmountItem(item);
    setAmountDue(String(item.amountDue ?? 0));
    setAmountError('');
  };

  // Close Amount Due dialog
  const handleCloseAmountDialog = () => {
    if (savingAmount) return;

    setAmountItem(null);
    setAmountDue('');
    setAmountError('');
  };

  // Validate and submit Amount Due
  const handleSubmitAmount = async () => {
    if (!amountItem) return;

    const normalizedAmount = amountDue.trim();

    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
      setAmountError('Enter a valid amount with maximum 2 decimal places.');
      return;
    }

    const parsedAmount = Number(normalizedAmount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      setAmountError('Amount cannot be negative.');
      return;
    }

    if (!onAmountDueChange) return;

    try {
      setSavingAmount(true);
      setAmountError('');

      await onAmountDueChange(amountItem, parsedAmount);

      setAmountItem(null);
      setAmountDue('');
    } catch (error) {
      setAmountError(error?.message || 'Unable to update amount due.');
    } finally {
      setSavingAmount(false);
    }
  };

  // Search and status filtering
  const filteredItems = items.filter((item) => {
    const searchText = search.trim().toLowerCase();

    const studentName = (item.student?.name || item.studentName || '').toLowerCase();

    const scholarNo = (item.student?.scholarNo || item.scholarNo || '').toLowerCase();

    const matchesSearch =
      !searchText || studentName.includes(searchText) || scholarNo.includes(searchText);

    const matchesStatus = statusFilter === 'ALL' || (item.status || 'PENDING') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get records for the current page
  const paginatedItems = serverPagination
    ? filteredItems
    : filteredItems.slice(page * limit, page * limit + limit);

  const hasActions = Boolean(onStatusChange || onAmountDueChange);

  // Handle search
  const handleSearchChange = (event) => {
    const value = event.target.value;

    setSearch(value);

    if (serverPagination) {
      onSearchChange?.(value);
    } else {
      setLocalPage(0);
    }
  };

  // Handle status filter
  const handleFilterChange = (event) => {
    const value = event.target.value;

    setStatusFilter(value);

    if (serverPagination) {
      onStatusFilterChange?.(value === 'ALL' ? '' : value);
    } else {
      setLocalPage(0);
    }
  };

  // Handle page change
  const handlePageChange = (_, newPage) => {
    if (serverPagination) {
      onPageChange?.(newPage + 1);
    } else {
      setLocalPage(newPage);
    }
  };

  // Handle page size change
  const handlePageSizeChange = (event) => {
    const newLimit = Number(event.target.value);

    if (serverPagination) {
      onPageSizeChange?.(newLimit);
      onPageChange?.(1);
    } else {
      setLocalLimit(newLimit);
      setLocalPage(0);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          py: 5,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper
      sx={{
        p: 2,
        borderRadius: 2,
        boxShadow: 'none',
      }}
    >
      {/* Heading and pending count */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2,
        }}
      >
        <Typography fontWeight={700}>Department Clearance Queue</Typography>

        <Chip label={`Pending: ${pendingCount}`} color="warning" size="small" />
      </Box>

      {/* Search and Status Filter */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <TextField
          size="small"
          label="Search Student"
          placeholder="Name or Scholar No."
          value={search}
          onChange={handleSearchChange}
          sx={{
            flex: 1,
            minWidth: 200,
          }}
        />

        <TextField
          select
          size="small"
          label="Filter Status"
          value={statusFilter}
          onChange={handleFilterChange}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Status</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="CLEAR">Clear</MenuItem>
          <MenuItem value="NOT_CLEAR">Not Clear</MenuItem>
        </TextField>
      </Box>

      {/* Student Queue Table */}
      {filteredItems.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" py={4}>
          No students found for the selected search or filter.
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Scholar No.</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Remark</TableCell>
                <TableCell>Amount Due</TableCell>

                {hasActions && <TableCell align="right">Action</TableCell>}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.student?.name || item.studentName || 'Student'}</TableCell>

                  <TableCell>{item.student?.scholarNo || item.scholarNo || '—'}</TableCell>

                  <TableCell>{item.departmentName || '—'}</TableCell>

                  <TableCell>
                    <Chip
                      size="small"
                      label={item.status || 'PENDING'}
                      color={
                        item.status === 'CLEAR'
                          ? 'success'
                          : item.status === 'NOT_CLEAR'
                            ? 'error'
                            : 'default'
                      }
                    />
                  </TableCell>

                  <TableCell>{item.remark || '—'}</TableCell>

                  <TableCell>₹{Number(item.amountDue || 0).toFixed(2)}</TableCell>

                  {hasActions && (
                    <TableCell align="right">
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          gap: 1,
                          flexWrap: 'wrap',
                        }}
                      >
                        {onAmountDueChange && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenAmountDialog(item)}
                          >
                            Update Amount
                          </Button>
                        )}

                        {onStatusChange && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={item.status === 'CLEAR'}
                              onClick={() => onStatusChange(item, 'CLEAR', '')}
                            >
                              Clear
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={item.status === 'NOT_CLEAR'}
                              onClick={() => handleOpenRemarkDialog(item)}
                            >
                              Not Clear
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Pagination */}
      <TablePagination
        component="div"
        count={serverPagination ? totalCount : filteredItems.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={limit}
        onRowsPerPageChange={handlePageSizeChange}
        rowsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* NOT_CLEAR Remark Dialog */}
      <Dialog
        open={Boolean(selectedItem)}
        onClose={handleCloseRemarkDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Mark Clearance as Not Clear</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the reason why this student&apos;s department clearance is not complete.
          </Typography>

          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="Remark"
            placeholder="Enter reason..."
            value={remark}
            onChange={(event) => setRemark(event.target.value.slice(0, 500))}
            helperText={`${remark.length}/500 characters`}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseRemarkDialog}>Cancel</Button>

          <Button
            variant="contained"
            color="error"
            disabled={!remark.trim()}
            onClick={handleSubmitNotClear}
          >
            Confirm Not Clear
          </Button>
        </DialogActions>
      </Dialog>

      {/* Amount Due Dialog */}
      <Dialog open={Boolean(amountItem)} onClose={handleCloseAmountDialog} fullWidth maxWidth="xs">
        <DialogTitle>Update Amount Due</DialogTitle>

        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update the pending amount for{' '}
            <strong>
              {amountItem?.student?.name || amountItem?.studentName || 'this student'}
            </strong>
            .
          </Typography>

          <TextField
            fullWidth
            required
            type="number"
            label="Amount Due (₹)"
            value={amountDue}
            onChange={(event) => {
              setAmountDue(event.target.value);
              setAmountError('');
            }}
            error={Boolean(amountError)}
            helperText={amountError || 'Enter amount up to 2 decimal places.'}
            slotProps={{
              htmlInput: {
                min: 0,
                step: '0.01',
              },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseAmountDialog} disabled={savingAmount}>
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={savingAmount || !amountDue.trim()}
            onClick={handleSubmitAmount}
          >
            {savingAmount ? <CircularProgress size={20} color="inherit" /> : 'Save Amount'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
