import type { RevenuePeriod } from './types';

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function shiftRevenueAnchor(
  anchor: string,
  period: RevenuePeriod,
  amount: number,
) {
  const date = parseDateKey(anchor);

  if (period === 'WEEK') {
    date.setUTCDate(date.getUTCDate() + amount * 7);
  } else if (period === 'MONTH') {
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + amount);
  } else {
    date.setUTCMonth(0, 1);
    date.setUTCFullYear(date.getUTCFullYear() + amount);
  }

  return toDateKey(date);
}

export function formatRevenueRange(start: string, end: string, period: RevenuePeriod) {
  const startDate = parseDateKey(start);
  const endDate = parseDateKey(end);

  if (period === 'YEAR') {
    return new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', year: 'numeric' }).format(startDate);
  }

  if (period === 'MONTH') {
    return new Intl.DateTimeFormat('tr-TR', {
      month: 'long',
      timeZone: 'UTC',
      year: 'numeric',
    }).format(startDate);
  }

  const formatter = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  return `${formatter.format(startDate)} – ${formatter.format(endDate)} ${endDate.getUTCFullYear()}`;
}
