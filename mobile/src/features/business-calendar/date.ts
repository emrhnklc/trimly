import type { Weekday } from '@/features/schedules/types';

const weekdayOrder: Weekday[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function logicalDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00.000Z`);
}

export function shiftDateKey(dateKey: string, days: number) {
  const date = logicalDate(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getWeekDateKeys(dateKey: string) {
  const date = logicalDate(dateKey);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const mondayKey = shiftDateKey(dateKey, -daysSinceMonday);

  return Array.from({ length: 7 }, (_, index) => shiftDateKey(mondayKey, index));
}

export function formatCalendarMonth(dateKey: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(logicalDate(dateKey));
}

export function formatCalendarWeekday(dateKey: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'UTC',
    weekday: 'short',
  })
    .format(logicalDate(dateKey))
    .replace('.', '');
}

export function formatCalendarDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    weekday: 'long',
  }).format(logicalDate(dateKey));
}

export function getDayNumber(dateKey: string) {
  return logicalDate(dateKey).getUTCDate();
}

export function getWeekday(dateKey: string) {
  return weekdayOrder[logicalDate(dateKey).getUTCDay()];
}

export function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getBusinessMinuteOfDay(value: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    hour12: false,
    hourCycle: 'h23',
    minute: '2-digit',
    timeZone,
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return Number(values.hour) * 60 + Number(values.minute);
}

export function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, '0');
  const remainingMinutes = (minutes % 60).toString().padStart(2, '0');
  return `${hours}:${remainingMinutes}`;
}
