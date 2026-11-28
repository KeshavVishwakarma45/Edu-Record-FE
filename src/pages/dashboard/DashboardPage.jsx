import { useEffect, useRef, useState } from 'react';
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
  primary: '#2864E8',
  primaryDark: '#2456CE',
  navy: '#172033',
  orange: '#E96B24',
  cream: '#FFFAF4',
  white: '#FFFFFF',
  dark: '#151B2B',
  grey: '#586273',
  muted: '#778092',
  line: '#E7E8EC',
  softBlue: '#E9EEFF',
  softOrange: '#FFF0E5',
};

const PAGE_LIMIT = 5;

const SUMMARY_CARDS = [
  {
    key: 'documentsNotReceived',
    title: 'Not received from university',
    description: 'Documents expected from university',
    path: '/inward',
    action: 'View missing list',
    color: COLORS.orange,
  },
  {
    key: 'documentsInCustody',
    title: 'In custody',
    description: 'Waiting to be handed over',
    path: '/handover',
    action: 'Find a student',
    color: COLORS.primary,
  },
  {
    key: 'clearancePending',
    title: 'Clearance pending',
    description: 'Department clearances pending',
    path: '/clearance',
    action: 'Open clearance',
    color: COLORS.primary,
  },
  {
    key: 'tcsAwaitingPrincipalApproval',
    title: 'TCs awaiting approval',
    description: 'Waiting for Principal approval',
    path: '/tc',
    action: 'Review TCs',
    color: COLORS.orange,
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
    TC_PENDING_APPROVAL: 'TCs waiting for Principal approval',
    DOCUMENT_NOT_RECEIVED: 'Documents not received',
    CLEARANCE_BLOCKED: 'TC applications blocked by clearance',
    TC_APPROVED_NOT_HANDED_OVER: 'Approved TCs not yet handed over',
  };

  return getValue(item?.title, titles[item?.type], item?.message, item?.type);
}

function getAttentionPath(type) {
  const paths = {
    TC_PENDING_APPROVAL: '/tc',
    DOCUMENT_NOT_RECEIVED: '/inward',
    CLEARANCE_BLOCKED: '/clearance',
    TC_APPROVED_NOT_HANDED_OVER: '/handover',
  };

  return paths[type] || '/';
}

function getAttentionIcon(type) {
  switch (type) {
    case 'TC_PENDING_APPROVAL':
      return <CheckCircleOutlineOutlined />;

    case 'DOCUMENT_NOT_RECEIVED':
      return <DescriptionOutlined />;

    case 'CLEARANCE_BLOCKED':
      return <WarningAmberOutlined />;

    case 'TC_APPROVED_NOT_HANDED_OVER':
      return <DescriptionOutlined />;

    default:
      return <HourglassEmptyOutlined />;
  }
}

function getBatchTitle(batch) {
  const course = typeof batch?.course === 'object' ? batch.course?.name : batch?.course;

  const year = getValue(batch?.yearName, batch?.year);
  const document = getValue(batch?.documentType, batch?.name, 'Inward batch');

  const parts = [course, year !== '—' ? `Year ${year}` : null, document].filter(Boolean);

  return parts.join(' · ');
}

function getProgressValue(received, expected) {
  const receivedNumber = Number(received);
  const expectedNumber = Number(expected);

  if (!Number.isFinite(receivedNumber) || !Number.isFinite(expectedNumber) || expectedNumber <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (receivedNumber / expectedNumber) * 100));
}

function DashboardCard({ children, sx = {} }) {
  return (
    <Paper
      elevation={0}
      sx={{
        minWidth: 0,
        bgcolor: COLORS.white,
        border: `1px solid ${COLORS.line}`,
        borderRadius: '12px',
        boxShadow: 'none',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

function SectionTitle({ children, action, onAction }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Typography
        sx={{
          fontSize: 16,
          fontWeight: 700,
          color: COLORS.dark,
        }}
      >
        {children}
      </Typography>

      {action && (
        <Button
          size="small"
          onClick={onAction}
          sx={{
            color: COLORS.primary,
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
        minHeight: 145,
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
        minHeight: 145,
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
    <DashboardCard
      sx={{
        minHeight: 166,
        p: 2.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'box-shadow 0.2s',
        '&:hover': {
          boxShadow: '0 5px 18px rgba(30, 40, 60, 0.06)',
        },
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.grey,
            lineHeight: 1.5,
          }}
        >
          {card.title}
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            fontSize: 32,
            lineHeight: 1.2,
            fontWeight: 700,
            color: card.color,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {loading ? '—' : getValue(value)}
        </Typography>

        <Typography
          sx={{
            mt: 0.75,
            fontSize: 12,
            color: COLORS.grey,
            lineHeight: 1.45,
          }}
        >
          {card.description}
        </Typography>
      </Box>

      <Button
        size="small"
        onClick={() => onNavigate(card.path)}
        sx={{
          alignSelf: 'flex-start',
          mt: 1,
          px: 0,
          color: COLORS.primary,
          fontWeight: 600,
          fontSize: 13,
          textTransform: 'none',
        }}
      >
        {card.action}
      </Button>
    </DashboardCard>
  );
}

function AttentionItem({ item, onReview }) {
  const isWarning = item?.type === 'DOCUMENT_NOT_RECEIVED' || item?.type === 'CLEARANCE_BLOCKED';

  return (
    <Box
      sx={{
        py: 1.35,
        px: 2,
        borderBottom: `1px solid ${COLORS.line}`,
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        gap={2}
        sx={{
          minWidth: 0,
          flex: 1,
          pr: 2,
        }}
      >
        <Stack direction="row" alignItems="center" gap={0} sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '9px',
              bgcolor: isWarning ? COLORS.softOrange : COLORS.softBlue,
              color: isWarning ? COLORS.orange : COLORS.primaryDark,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              '& .MuiSvgIcon-root': {
                fontSize: 19,
              },
            }}
          >
            {getAttentionIcon(item?.type)}
          </Box>

          <Box sx={{ minWidth: 0, ml: '12px' }}>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.dark,
                lineHeight: 1.4,
              }}
            >
              {getAttentionTitle(item)}
            </Typography>

            <Typography
              sx={{
                mt: 0.25,
                fontSize: 12,
                color: COLORS.grey,
                lineHeight: 1.45,
              }}
            >
              {getValue(
                item?.description,
                item?.details,
                item?.message,
                item?.student?.name,
                item?.studentName,
              )}
            </Typography>
          </Box>
        </Stack>

        <Button
          size="small"
          variant="outlined"
          onClick={() => onReview(getAttentionPath(item?.type))}
          sx={{
            flexShrink: 0,
            minWidth: 76,
            borderColor: '#AEB5C1',
            color: COLORS.dark,
            borderRadius: '22px',
            px: 1.75,
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              borderColor: COLORS.primary,
              bgcolor: '#F7F9FF',
            },
          }}
        >
          Review
        </Button>
      </Stack>
    </Box>
  );
}

function InwardBatchItem({ batch, index }) {
  const expected = getValue(
    batch?.totalExpected,
    batch?.expectedCount,
    batch?.totalDocuments,
    batch?.total,
  );

  const received = getValue(batch?.receivedCount, batch?.totalReceived, batch?.received);

  const missing = getValue(batch?.missingCount, batch?.totalMissing, batch?.missing);

  const progress = getProgressValue(received, expected);

  return (
    <Box
      key={batch?._id || batch?.id || index}
      sx={{
        py: 1.5,
        borderBottom: `1px solid ${COLORS.line}`,
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: COLORS.dark,
            minWidth: 0,
          }}
        >
          {getBatchTitle(batch)}
        </Typography>

        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.dark,
            whiteSpace: 'nowrap',
          }}
        >
          {received} / {expected}
        </Typography>
      </Stack>

      <Box
        sx={{
          mt: 1,
          width: '100%',
          height: 6,
          bgcolor: '#E8EBF1',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${progress}%`,
            height: '100%',
            bgcolor: COLORS.primary,
            borderRadius: 10,
            transition: 'width 0.3s ease',
          }}
        />
      </Box>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={0.5}
        sx={{ mt: 0.75 }}
      >
        <Typography
          sx={{
            fontSize: 11.5,
            color: COLORS.grey,
          }}
        >
          Received {formatDate(batch?.createdAt || batch?.receivedDate)}
        </Typography>

        <Typography
          sx={{
            fontSize: 11.5,
            color: COLORS.grey,
          }}
        >
          {missing} missing
        </Typography>
      </Stack>
    </Box>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectedInstitute } = useAuth();

  const instituteId = selectedInstitute?._id || selectedInstitute?.id || 'all';

  const previousInstituteId = useRef(instituteId);
  const instituteName = selectedInstitute?.name || 'All institutes';

  const [summary, setSummary] = useState(null);

  const [attention, setAttention] = useState([]);

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

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setSummaryLoading(true);
      setAttentionLoading(true);
      setInwardLoading(true);
      setTcLoading(true);

      const instituteChanged = previousInstituteId.current !== instituteId;

      if (instituteChanged) {
        previousInstituteId.current = instituteId;

        setSummary(null);
        setAttention([]);

        setInwardRows([]);
        setInwardTotal(0);

        setTcRows([]);
        setTcTotal(0);

        setInwardPage(0);
        setTcPage(0);
      }

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
  }, [instituteId, inwardPage, tcPage, reloadKey]);

  const today = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  const handleRetry = () => {
    setReloadKey((current) => current + 1);
  };

  return (
    <Box
      sx={{
        minHeight: '100%',
        width: '100%',
        boxSizing: 'border-box',
        bgcolor: COLORS.cream,
        px: {
          xs: 2,
          sm: 2.5,
          md: 3,
          lg: 3.5,
        },
        py: {
          xs: 2.5,
          sm: 3,
          md: 3.5,
        },
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Dashboard heading and actions */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        gap={2}
        sx={{
          mb: 3,
          position: 'relative',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 25,
              fontWeight: 700,
              color: COLORS.dark,
              lineHeight: 1.3,
            }}
          >
            Dashboard
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: 14,
              color: COLORS.grey,
            }}
          >
            What needs attention at {instituteName} today, {today}.
          </Typography>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          gap={1}
          sx={{
            position: { xs: 'static', md: 'absolute' },
            top: 0,
            right: 0,
            flexShrink: 0,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <Button
            variant="outlined"
            startIcon={<AddOutlined />}
            onClick={() => navigate('/inward')}
            sx={{
              minHeight: 42,
              px: 2,
              borderRadius: '24px',
              borderColor: '#AEB5C1',
              color: COLORS.dark,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: COLORS.primary,
                bgcolor: '#FFFDF9',
              },
            }}
          >
            New inward batch
          </Button>

          <Button
            variant="contained"
            endIcon={<ArrowForwardOutlined />}
            onClick={() => navigate('/handover')}
            sx={{
              minHeight: 42,
              px: 2,
              borderRadius: '24px',
              bgcolor: COLORS.primary,
              boxShadow: 'none',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                bgcolor: COLORS.primaryDark,
                boxShadow: 'none',
              },
            }}
          >
            Hand over documents
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      {summaryError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          Could not load dashboard summary: {summaryError}
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))',
          },
          gap: 2,
          mb: 2.5,
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

      {/* Attention and recent inward batches */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'minmax(0, 1.55fr) minmax(300px, 1fr)',
          },
          gap: 2,
          mb: 2.5,
          alignItems: 'stretch',
        }}
      >
        {/* Needs your attention */}
        <DashboardCard sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.75,
              borderBottom: `1px solid ${COLORS.line}`,
            }}
          >
            <SectionTitle>Needs your attention</SectionTitle>
          </Box>

          {attentionError && (
            <Alert
              severity="error"
              sx={{ m: 2 }}
              action={
                <Button color="inherit" size="small" onClick={handleRetry}>
                  Retry
                </Button>
              }
            >
              {attentionError}
            </Alert>
          )}

          {attentionLoading ? (
            <LoadingState />
          ) : !attentionError && attention.length === 0 ? (
            <EmptyState message="No pending actions require your attention." />
          ) : (
            <Box>
              {attention.map((item, index) => (
                <AttentionItem
                  key={item?._id || item?.id || `${item?.type}-${index}`}
                  item={item}
                  onReview={navigate}
                />
              ))}
            </Box>
          )}
        </DashboardCard>

        {/* Recent inward batches */}
        <DashboardCard sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2.5,
              py: 1.75,
              borderBottom: `1px solid ${COLORS.line}`,
            }}
          >
            <SectionTitle action="View all" onAction={() => navigate('/inward')}>
              Recent inward batches
            </SectionTitle>
          </Box>

          <Box sx={{ px: 2.5, pt: 0.5 }}>
            {inwardError && (
              <Alert
                severity="error"
                sx={{ my: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={handleRetry}>
                    Retry
                  </Button>
                }
              >
                {inwardError}
              </Alert>
            )}

            {inwardLoading ? (
              <LoadingState />
            ) : !inwardError && inwardRows.length === 0 ? (
              <EmptyState message="No inward batches found." />
            ) : (
              <Stack spacing={0}>
                {inwardRows.map((batch, index) => (
                  <InwardBatchItem
                    key={batch?._id || batch?.id || index}
                    batch={batch}
                    index={index}
                  />
                ))}
              </Stack>
            )}

            {!inwardLoading && !inwardError && inwardRows.length > 0 && (
              <TablePagination
                component="div"
                count={inwardTotal}
                page={inwardPage}
                onPageChange={(_, page) => setInwardPage(page)}
                rowsPerPage={PAGE_LIMIT}
                rowsPerPageOptions={[PAGE_LIMIT]}
                sx={{
                  mt: 0.5,
                  '.MuiTablePagination-toolbar': {
                    px: 0,
                    minHeight: 42,
                  },
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                    fontSize: 11,
                  },
                }}
              />
            )}
          </Box>
        </DashboardCard>
      </Box>

      {/* Recently issued TCs */}
      <DashboardCard
        sx={{
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            borderBottom: `1px solid ${COLORS.line}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <SectionTitle>Recently issued TCs</SectionTitle>

            <Button
              size="small"
              endIcon={<OpenInNewOutlined />}
              onClick={() => navigate('/tc')}
              sx={{
                color: COLORS.primary,
                fontWeight: 600,
                textTransform: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              See all
            </Button>
          </Stack>
        </Box>

        {tcError && (
          <Alert
            severity="error"
            sx={{ m: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRetry}>
                Retry
              </Button>
            }
          >
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
                    height: 42,
                    px: 1.75,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    {ISSUED_TC_COLUMNS.map((column) => (
                      <TableCell
                        key={column}
                        sx={{
                          color: COLORS.grey,
                          fontSize: 11,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          bgcolor: COLORS.white,
                        }}
                      >
                        {column}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {tcRows.map((tc, index) => (
                    <TableRow
                      key={tc?._id || tc?.id || index}
                      sx={{
                        '&:hover': {
                          bgcolor: '#FFFCF8',
                        },
                      }}
                    >
                      <TableCell sx={{ fontSize: 12, fontWeight: 600 }}>
                        {getValue(tc?.refNo, tc?.referenceNumber)}
                      </TableCell>

                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc?.bookSerial, tc?.serial, tc?.serialNo)}
                      </TableCell>

                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc?.student?.name, tc?.studentName)}
                      </TableCell>

                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(tc?.course?.name, tc?.courseName, tc?.course)}
                      </TableCell>

                      <TableCell sx={{ fontSize: 12 }}>
                        {formatDate(tc?.issuedAt || tc?.issuedDate)}
                      </TableCell>

                      <TableCell sx={{ fontSize: 12 }}>
                        {getValue(
                          tc?.collectedBy,
                          tc?.receivedBy,
                          tc?.collectionDetails?.collectedBy,
                        )}
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
                '.MuiTablePagination-toolbar': {
                  px: 2,
                  minHeight: 42,
                },
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  fontSize: 11,
                },
              }}
            />
          </>
        )}
      </DashboardCard>
    </Box>
  );
}
