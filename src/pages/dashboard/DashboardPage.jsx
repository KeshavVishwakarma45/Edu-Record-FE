import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';

import {
  AddOutlined,
  ArrowForwardOutlined,
  OpenInNewOutlined,
  WarningAmberOutlined,
  DescriptionOutlined,
  HourglassEmptyOutlined,
  CheckCircleOutlineOutlined,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { dashboardApi } from '@/api/dashboard';

const COLORS = {
  primary: '#3662E3',
  primaryDark: '#2A4DD0',
  navy: '#2741AE',
  orange: '#E5873C',
  cream: '#FEFAF6',
  white: '#FFFFFF',
  dark: '#0B0F1D',
  grey: '#4D5562',
  line: '#E6E8EC',
  softBlue: '#EFF2FD',
  softOrange: '#FBEEE4',
};

const PAGE_LIMIT = 5;

const SUMMARY_CARDS = [
  {
    key: 'documentsNotReceived',
    title: 'Not received from university',
    description: 'Documents expected or not received',
    path: '/inward',
    action: 'View missing list',
    color: COLORS.orange,
    icon: <WarningAmberOutlined />,
  },
  {
    key: 'documentsInCustody',
    title: 'In custody',
    description: 'Waiting to be handed over',
    path: '/hand-over',
    action: 'Find a student',
    color: COLORS.primary,
    icon: <DescriptionOutlined />,
  },
  {
    key: 'clearancePending',
    title: 'Clearance pending',
    description: 'Department clearances pending',
    path: '/clearance',
    action: 'Open clearance',
    color: COLORS.navy,
    icon: <HourglassEmptyOutlined />,
  },
  {
    key: 'tcsAwaitingPrincipalApproval',
    title: 'TCs awaiting approval',
    description: 'Drafts waiting for the Principal',
    path: '/tc',
    action: 'Review TCs',
    color: COLORS.orange,
    icon: <CheckCircleOutlineOutlined />,
  },
];

const ISSUED_TC_COLUMNS = ['REF NO.', 'SERIAL', 'STUDENT', 'COURSE', 'ISSUED ON', 'COLLECTED BY'];

function getRows(response) {
  if (Array.isArray(response)) return response;

  return response?.rows || response?.items || response?.data || response?.results || [];
}

function getTotal(response, rows) {
  return response?.meta?.total ?? response?.pagination?.total ?? response?.total ?? rows.length;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong while loading dashboard data.'
  );
}

function getValue(...values) {
  const value = values.find((item) => item !== undefined && item !== null && item !== '');

  return value ?? '—';
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
}

function getAttentionTitle(item) {
  const titles = {
    TC_PENDING_APPROVAL: 'TC waiting for Principal approval',
    DOCUMENT_NOT_RECEIVED: 'Documents not received',
    CLEARANCE_BLOCKED: 'Clearance blocked',
    TC_APPROVED_NOT_HANDED_OVER: 'Approved TC awaiting handover',
  };

  return getValue(item?.title, titles[item?.type], item?.message, item?.type);
}

function getAttentionPath(type) {
  const paths = {
    TC_PENDING_APPROVAL: '/tc',
    DOCUMENT_NOT_RECEIVED: '/inward',
    CLEARANCE_BLOCKED: '/clearance',
    TC_APPROVED_NOT_HANDED_OVER: '/hand-over',
  };

  return paths[type] || '/';
}

function SectionTitle({ children, action, onAction }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography
        sx={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 18,
          fontWeight: 600,
          color: COLORS.dark,
        }}
      >
        {children}
      </Typography>

      {action && (
        <Button
          size="small"
          onClick={onAction}
          endIcon={<ArrowForwardOutlined />}
          sx={{
            color: COLORS.primaryDark,
            fontWeight: 600,
            textTransform: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {action}
        </Button>
      )}
    </Stack>
  );
}

function EmptyState({ message }) {
  return (
    <Box
      sx={{
        minHeight: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: 13,
          color: COLORS.grey,
          textAlign: 'center',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

function LoadingState() {
  return (
    <Box
      sx={{
        minHeight: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress size={26} />
    </Box>
  );
}

function SummaryCard({ card, value, loading, onNavigate }) {
  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 0,
        minHeight: 188,
        p: 2.5,
        border: `1px solid ${COLORS.line}`,
        borderRadius: '12px',
        bgcolor: COLORS.white,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        '&:hover': {
          boxShadow: '0 4px 16px rgba(11,15,29,0.07)',
        },
      }}
    >
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.grey,
              lineHeight: 1.5,
            }}
          >
            {card.title}
          </Typography>

          <Box
            sx={{
              width: 34,
              height: 34,
              flexShrink: 0,
              borderRadius: '50%',
              bgcolor: card.color === COLORS.orange ? COLORS.softOrange : COLORS.softBlue,
              color: card.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {card.icon}
          </Box>
        </Stack>

        <Typography
          sx={{
            mt: 1,
            fontSize: 32,
            lineHeight: 1.3,
            fontWeight: 700,
            color: card.color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {loading ? '—' : (value ?? '—')}
        </Typography>

        <Typography
          sx={{
            mt: 0.8,
            fontSize: 12,
            lineHeight: 1.6,
            color: COLORS.grey,
          }}
        >
          {card.description}
        </Typography>
      </Box>

      <Button
        size="small"
        onClick={() => onNavigate(card.path)}
        endIcon={<ArrowForwardOutlined />}
        sx={{
          alignSelf: 'flex-start',
          mt: 1.5,
          px: 0,
          color: card.color,
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        {card.action}
      </Button>
    </Paper>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedInstitute } = useAuth();

  const instituteId = selectedInstitute?._id || selectedInstitute?.id || 'all';

  const instituteName = selectedInstitute?.name || 'All institutes';

  const [summary, setSummary] = useState(null);
  const [attention, setAttention] = useState([]);
  const [attentionTotal, setAttentionTotal] = useState(0);

  const [inwardRows, setInwardRows] = useState([]);
  const [inwardTotal, setInwardTotal] = useState(0);
  const [inwardPage, setInwardPage] = useState(0);

  const [tcRows, setTcRows] = useState([]);
  const [tcTotal, setTcTotal] = useState(0);
  const [tcPage, setTcPage] = useState(0);

  const [summaryLoading, setSummaryLoading] = useState(true);
  const [attentionLoading, setAttentionLoading] = useState(true);
  const [inwardLoading, setInwardLoading] = useState(true);
  const [tcLoading, setTcLoading] = useState(true);

  const [summaryError, setSummaryError] = useState('');
  const [attentionError, setAttentionError] = useState('');
  const [inwardError, setInwardError] = useState('');
  const [tcError, setTcError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setSummaryLoading(true);
      setAttentionLoading(true);
      setInwardLoading(true);
      setTcLoading(true);

      setSummaryError('');
      setAttentionError('');
      setInwardError('');
      setTcError('');

      const requests = await Promise.allSettled([
        dashboardApi.getSummary(instituteId),
        dashboardApi.getAttention({ limit: 5 }, instituteId),
        dashboardApi.getRecentInward({ page: inwardPage + 1, limit: PAGE_LIMIT }, instituteId),
        dashboardApi.getRecentTCs({ page: tcPage + 1, limit: PAGE_LIMIT }, instituteId),
      ]);

      if (!active) return;

      const [summaryResult, attentionResult, inwardResult, tcResult] = requests;

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value?.data ?? summaryResult.value);
      } else {
        setSummaryError(getErrorMessage(summaryResult.reason));
      }
      setSummaryLoading(false);

      if (attentionResult.status === 'fulfilled') {
        const response = attentionResult.value?.data ?? attentionResult.value;
        const items = response?.items || response?.rows || [];

        setAttention(items);
        setAttentionTotal(response?.total ?? response?.meta?.total ?? items.length);
      } else {
        setAttentionError(getErrorMessage(attentionResult.reason));
      }
      setAttentionLoading(false);

      if (inwardResult.status === 'fulfilled') {
        const rows = getRows(inwardResult.value);

        setInwardRows(rows);
        setInwardTotal(getTotal(inwardResult.value, rows));
      } else {
        setInwardError(getErrorMessage(inwardResult.reason));
      }
      setInwardLoading(false);

      if (tcResult.status === 'fulfilled') {
        const rows = getRows(tcResult.value);

        setTcRows(rows);
        setTcTotal(getTotal(tcResult.value, rows));
      } else {
        setTcError(getErrorMessage(tcResult.reason));
      }
      setTcLoading(false);
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, [instituteId, inwardPage, tcPage]);

  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  return (
    <Box
      sx={{
        minHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: COLORS.cream,
        p: { xs: 2, sm: 2.5, md: 4 },
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Dashboard Header */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: COLORS.dark,
            }}
          >
            Dashboard
          </Typography>

          <Typography sx={{ mt: 0.5, fontSize: 14, color: COLORS.grey }}>
            What needs attention at {instituteName} today, {today}.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1.5}
          sx={{
            ml: { md: 'auto' },
            flexShrink: 0,
            justifyContent: 'flex-end',
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => navigate('/inward')}
            sx={{
              minHeight: { xs: 44, md: 40 },
              px: 2.5,
              borderRadius: 20,
              bgcolor: COLORS.primary,
              boxShadow: 'none',
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: COLORS.primaryDark,
                boxShadow: 'none',
              },
            }}
          >
            New inward batch
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowForwardOutlined />}
            onClick={() => navigate('/hand-over')}
            sx={{
              minHeight: { xs: 44, md: 40 },
              px: 2.5,
              borderRadius: 20,
              borderColor: COLORS.primary,
              color: COLORS.primary,
              fontWeight: 600,
              textTransform: 'none',
              whiteSpace: 'nowrap',
              '&:hover': {
                borderColor: COLORS.primaryDark,
                bgcolor: COLORS.softBlue,
              },
            }}
          >
            Hand over documents
          </Button>
        </Stack>
      </Stack>

      {/* Summary Cards */}
      {summaryError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load dashboard summary: {summaryError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 3,
        }}
      >
        {SUMMARY_CARDS.map((card) => (
          <SummaryCard
            key={card.key}
            card={card}
            value={summary?.[card.key]}
            loading={summaryLoading}
            onNavigate={navigate}
          />
        ))}
      </Box>

      {/* Attention and Inward Batches */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 1.65fr) minmax(300px, 1fr)',
          },
          gap: 2,
          mb: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Needs Your Attention */}
        <Paper
          elevation={0}
          sx={{
            minWidth: 0,
            p: 2.5,
            border: `1px solid ${COLORS.line}`,
            borderRadius: '12px',
            bgcolor: COLORS.white,
          }}
        >
          <SectionTitle>Needs your attention ({attentionTotal})</SectionTitle>

          {attentionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {attentionError}
            </Alert>
          )}

          {attentionLoading ? (
            <LoadingState />
          ) : !attentionError && attention.length === 0 ? (
            <EmptyState message="No pending actions require your attention." />
          ) : (
            <Stack divider={<Box sx={{ borderBottom: `1px solid ${COLORS.line}` }} />}>
              {attention.map((item, index) => (
                <Box key={item._id || item.id || `${item.type}-${index}`} sx={{ py: 1.7 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: COLORS.dark,
                        }}
                      >
                        {getAttentionTitle(item)}
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.5,
                          fontSize: 12,
                          color: COLORS.grey,
                          lineHeight: 1.6,
                        }}
                      >
                        {getValue(
                          item.description,
                          item.details,
                          item.message,
                          item.student?.name,
                          item.studentName,
                        )}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      onClick={() => navigate(getAttentionPath(item.type))}
                      sx={{
                        flexShrink: 0,
                        color: COLORS.primaryDark,
                        fontWeight: 600,
                        textTransform: 'none',
                      }}
                    >
                      Review
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Recent Inward Batches */}
        <Paper
          elevation={0}
          sx={{
            minWidth: 0,
            p: 2.5,
            border: `1px solid ${COLORS.line}`,
            borderRadius: '12px',
            bgcolor: COLORS.white,
          }}
        >
          <SectionTitle action="View all" onAction={() => navigate('/inward')}>
            Recent inward batches
          </SectionTitle>

          {inwardError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {inwardError}
            </Alert>
          )}

          {inwardLoading ? (
            <LoadingState />
          ) : !inwardError && inwardRows.length === 0 ? (
            <EmptyState message="No inward batches found." />
          ) : (
            <>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {inwardRows.map((batch, index) => {
                  const expected = getValue(
                    batch.totalExpected,
                    batch.expectedCount,
                    batch.totalDocuments,
                    batch.total,
                  );
                  const received = getValue(
                    batch.receivedCount,
                    batch.totalReceived,
                    batch.received,
                  );
                  const missing = getValue(batch.missingCount, batch.totalMissing, batch.missing);

                  return (
                    <Box
                      key={batch._id || batch.id || index}
                      sx={{
                        pb: 1.5,
                        borderBottom: `1px solid ${COLORS.line}`,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLORS.dark,
                        }}
                      >
                        {getValue(batch.documentType, batch.name, 'Inward batch')}
                      </Typography>

                      <Typography sx={{ mt: 0.5, fontSize: 12, color: COLORS.grey }}>
                        Ref: {getValue(batch.referenceNumber, batch.referenceNo)}
                      </Typography>

                      <Typography sx={{ mt: 0.5, fontSize: 12, color: COLORS.grey }}>
                        {received} received / {expected} expected
                        {missing !== '—' ? ` · ${missing} missing` : ''}
                      </Typography>

                      <Typography sx={{ mt: 0.5, fontSize: 11, color: COLORS.grey }}>
                        {formatDate(batch.createdAt || batch.receivedDate)}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>

              <TablePagination
                component="div"
                count={inwardTotal}
                page={inwardPage}
                onPageChange={(_, page) => setInwardPage(page)}
                rowsPerPage={PAGE_LIMIT}
                rowsPerPageOptions={[PAGE_LIMIT]}
                sx={{
                  mt: 1,
                  '.MuiTablePagination-toolbar': { px: 0 },
                }}
              />
            </>
          )}
        </Paper>
      </Box>

      {/* Recently Issued TCs */}
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          minWidth: 0,
          p: 2.5,
          boxSizing: 'border-box',
          border: `1px solid ${COLORS.line}`,
          borderRadius: '12px',
          bgcolor: COLORS.white,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <SectionTitle>Recently issued TCs</SectionTitle>

          <Button
            size="small"
            endIcon={<OpenInNewOutlined />}
            onClick={() => navigate('/tc')}
            sx={{
              color: COLORS.primaryDark,
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            See all
          </Button>
        </Stack>

        {tcError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {tcError}
          </Alert>
        )}

        {tcLoading ? (
          <LoadingState />
        ) : !tcError && tcRows.length === 0 ? (
          <EmptyState message="No issued TCs found." />
        ) : (
          <>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table
                size="small"
                sx={{
                  minWidth: 750,
                  '& .MuiTableCell-root': {
                    borderBottom: `1px solid ${COLORS.line}`,
                    height: 48,
                    px: 1.5,
                  },
                }}
              >
                <TableHead>
                  <TableRow sx={{ bgcolor: COLORS.cream }}>
                    {ISSUED_TC_COLUMNS.map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          color: COLORS.grey,
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {tcRows.map((tc, index) => (
                    <TableRow key={tc._id || tc.id || index}>
                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc.refNo, tc.referenceNumber)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc.bookSerial, tc.serial, tc.serialNo)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc.student?.name, tc.studentName)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc.course?.name, tc.courseName, tc.course)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {formatDate(tc.issuedAt || tc.issuedDate)}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc.collectedBy, tc.receivedBy, tc.collectionDetails?.collectedBy)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={tcTotal}
              page={tcPage}
              onPageChange={(_, page) => setTcPage(page)}
              rowsPerPage={PAGE_LIMIT}
              rowsPerPageOptions={[PAGE_LIMIT]}
              sx={{
                '.MuiTablePagination-toolbar': { px: 0 },
              }}
            />
          </>
        )}
      </Paper>
    </Box>
  );
}
