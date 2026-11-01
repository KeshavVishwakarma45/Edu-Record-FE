// Dates are stored in UTC and always shown in India time (IST), as dd/mm/yyyy like the paper books.
const IST = 'Asia/Kolkata';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: IST,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const rupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

function toDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// formatDate('2026-09-15T00:00:00Z') -> '15/09/2026'
export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFormat.format(date) : '—';
}

// formatDateTime('2026-09-15T06:30:00Z') -> '15/09/2026, 12:00 pm'
export function formatDateTime(value) {
  const date = toDate(value);
  return date ? dateTimeFormat.format(date) : '—';
}

// formatCurrency(123456.5) -> '₹1,23,456.5'  (Indian digit grouping)
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  return rupeeFormat.format(Number(amount));
}

// Any error (from api/client.js, a plain Error or a string) -> a message to show the user
export function getErrorMessage(error) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  return error.message || 'Something went wrong. Please try again.';
}
