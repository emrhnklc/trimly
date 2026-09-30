import { Weekday } from '@prisma/client';
import { DateTime } from 'luxon';
import { workingHoursForDate } from './effective-working-hours';

describe('workingHoursForDate', () => {
  const planned = [
    { weekday: Weekday.MONDAY, startTime: '10:00', endTime: '18:00' },
  ];
  const previous = [
    { weekday: Weekday.MONDAY, startTime: '09:00', endTime: '19:00' },
  ];
  const effectiveFrom = new Date('2026-09-29T21:00:00.000Z');

  it('keeps the previous schedule before the effective date', () => {
    expect(
      workingHoursForDate(
        planned,
        previous,
        effectiveFrom,
        DateTime.fromISO('2026-09-29T12:00:00', { zone: 'Europe/Istanbul' }),
      ),
    ).toEqual(previous);
  });

  it('uses the planned schedule from the effective date', () => {
    expect(
      workingHoursForDate(
        planned,
        previous,
        effectiveFrom,
        DateTime.fromISO('2026-09-30T00:00:00', { zone: 'Europe/Istanbul' }),
      ),
    ).toEqual(planned);
  });
});
