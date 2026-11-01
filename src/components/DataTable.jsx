import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';

// Every list screen uses this table. Paging, sorting and search happen on the SERVER:
// the table only shows one page and tells useList what changed.
//
// columns:    [{ field, header, render?(row), sortable?, width? }]
// params:     { page, limit, sort, search } from useList
// rowActions: [{ label, icon: EditIcon, onClick(row), color? }] shown as icon buttons per row
export default function DataTable({
  columns,
  rows,
  total,
  loading,
  error,
  onRetry,
  params,
  onParamsChange,
  onRowClick,
  rowActions = [],
  searchPlaceholder = 'Search',
  emptyText = 'No records found',
}) {
  const columnCount = columns.length + (rowActions.length > 0 ? 1 : 0);
  const sortField = params.sort?.replace(/^-/, '');
  const sortDirection = params.sort?.startsWith('-') ? 'desc' : 'asc';

  // First click sorts A-Z; clicking the same column again flips the order
  const handleSort = (field) => {
    const descending = sortField === field && sortDirection === 'asc';
    onParamsChange({ sort: descending ? `-${field}` : field });
  };

  const fullWidthRow = (content) => (
    <TableRow>
      <TableCell colSpan={columnCount} sx={{ borderBottom: 0 }}>
        {content}
      </TableCell>
    </TableRow>
  );

  let body;
  if (error) {
    body = fullWidthRow(<ErrorState error={error} onRetry={onRetry} />);
  } else if (loading) {
    body = Array.from({ length: Math.min(params.limit, 5) }, (_, index) => (
      <TableRow key={index}>
        {Array.from({ length: columnCount }, (__, cell) => (
          <TableCell key={cell}>
            <Skeleton />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (rows.length === 0) {
    body = fullWidthRow(
      <EmptyState
        title={emptyText}
        description={params.search ? 'Try a different search.' : undefined}
      />,
    );
  } else {
    body = rows.map((row) => (
      <TableRow
        key={row._id}
        hover
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        onKeyDown={onRowClick ? (event) => event.key === 'Enter' && onRowClick(row) : undefined}
        tabIndex={onRowClick ? 0 : undefined}
        sx={onRowClick ? { cursor: 'pointer' } : undefined}
      >
        {columns.map((column) => (
          <TableCell key={column.field}>
            {column.render ? column.render(row) : row[column.field]}
          </TableCell>
        ))}
        {rowActions.length > 0 && (
          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
            {rowActions.map(({ label, icon: Icon, onClick, color }) => (
              <Tooltip key={label} title={label}>
                <IconButton
                  aria-label={label}
                  color={color}
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation(); // do not also trigger onRowClick
                    onClick(row);
                  }}
                >
                  <Icon fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
          </TableCell>
        )}
      </TableRow>
    ));
  }

  return (
    <Paper>
      <Box sx={{ p: 2, pb: 1 }}>
        <TextField
          type="search"
          label="Search"
          placeholder={searchPlaceholder}
          value={params.search ?? ''}
          onChange={(event) => onParamsChange({ search: event.target.value })}
          sx={{ maxWidth: { sm: 360 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* On small screens the table scrolls sideways inside this box, not the whole page */}
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 640 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.field} sx={{ width: column.width }}>
                  {column.sortable ? (
                    <TableSortLabel
                      active={sortField === column.field}
                      direction={sortField === column.field ? sortDirection : 'asc'}
                      onClick={() => handleSort(column.field)}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                </TableCell>
              ))}
              {rowActions.length > 0 && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>{body}</TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={total}
        page={total === 0 ? 0 : params.page - 1}
        rowsPerPage={params.limit}
        rowsPerPageOptions={[10, 20, 50, 100]}
        labelRowsPerPage="Rows"
        onPageChange={(_event, page) => onParamsChange({ page: page + 1 })}
        onRowsPerPageChange={(event) => onParamsChange({ limit: Number(event.target.value) })}
      />
    </Paper>
  );
}
