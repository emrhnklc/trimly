import type { Weekday } from '@/features/schedules/types';

export const weekdayOptions: { label: string; shortLabel: string; value: Weekday }[] = [
  { label: 'Pazartesi', shortLabel: 'Pzt', value: 'MONDAY' },
  { label: 'Salı', shortLabel: 'Sal', value: 'TUESDAY' },
  { label: 'Çarşamba', shortLabel: 'Çar', value: 'WEDNESDAY' },
  { label: 'Perşembe', shortLabel: 'Per', value: 'THURSDAY' },
  { label: 'Cuma', shortLabel: 'Cum', value: 'FRIDAY' },
  { label: 'Cumartesi', shortLabel: 'Cmt', value: 'SATURDAY' },
  { label: 'Pazar', shortLabel: 'Paz', value: 'SUNDAY' },
];

export const defaultOpeningTime = '09:00';
export const defaultClosingTime = '19:00';

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatWeeklyDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) return `${hours} saat`;
  return `${hours} sa ${remainingMinutes} dk`;
}
