import { formatBusinessTime, getDateKey } from '@/features/business-appointments/date';

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
}

export function formatDateKey(dateKey: string, options?: { short?: boolean }) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: options?.short ? 'short' : 'long',
    timeZone: 'UTC',
    weekday: options?.short ? undefined : 'long',
    year: 'numeric',
  }).format(parseDateKey(dateKey));
}

function getTimeZoneOffset(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return representedAsUtc - date.getTime();
}

export function zonedDateTimeToIso(dateKey: string, time: string, timeZone: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = localAsUtc;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    timestamp = localAsUtc - getTimeZoneOffset(new Date(timestamp), timeZone);
  }

  return new Date(timestamp).toISOString();
}

export function createDefaultBlockWindow(timeZone: string) {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setUTCMinutes(Math.ceil(start.getUTCMinutes() / 30) * 30, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    startDate: getDateKey(start, timeZone),
    startTime: formatBusinessTime(start.toISOString(), timeZone),
    endDate: getDateKey(end, timeZone),
    endTime: formatBusinessTime(end.toISOString(), timeZone),
  };
}

export function formatScheduleBlockDateRange(
  startsAt: string,
  endsAt: string,
  timeZone: string,
) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startDateKey = getDateKey(start, timeZone);
  const endDateKey = getDateKey(end, timeZone);
  const startTime = formatBusinessTime(startsAt, timeZone);
  const endTime = formatBusinessTime(endsAt, timeZone);

  if (startDateKey === endDateKey) {
    return `${formatDateKey(startDateKey)} · ${startTime}–${endTime}`;
  }

  return `${formatDateKey(startDateKey, { short: true })} ${startTime} – ${formatDateKey(endDateKey, { short: true })} ${endTime}`;
}
