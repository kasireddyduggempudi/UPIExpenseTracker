const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** 'Mar 2025' */
export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** 'March 2025' */
export function monthFullLabel(year: number, month: number): string {
  return `${MONTH_FULL[month - 1]} ${year}`;
}

/** Zero-pad month number: 3 → '03' */
export function padMonth(month: number): string {
  return String(month).padStart(2, '0');
}

/** 'YYYY-MM-DD' for today */
export function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${padMonth(d.getMonth() + 1)}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** Format a 'YYYY-MM-DD' string to '15 Mar 2025' */
export function formatDateDisplay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

/** Move a 'YYYY-MM-DD' date by `days` days */
export function shiftDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${padMonth(d.getMonth() + 1)}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** Format ₹ amount with commas: 1234567 → '₹12,34,567' (Indian format) */
export function formatAmount(amount: number): string {
  const fixed = amount.toFixed(2).replace(/\.00$/, '');
  // Indian number format
  const parts = fixed.split('.');
  const intPart = parts[0];
  const decPart = parts[1] ? `.${parts[1]}` : '';
  let result = '';
  const n = intPart.length;
  if (n <= 3) {
    result = intPart;
  } else {
    result = intPart.slice(-3);
    let remaining = intPart.slice(0, n - 3);
    while (remaining.length > 2) {
      result = `${remaining.slice(-2)},${result}`;
      remaining = remaining.slice(0, remaining.length - 2);
    }
    result = `${remaining},${result}`;
  }
  return `₹${result}${decPart}`;
}

/** Collision-resistant id: timestamp base36 + random */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
