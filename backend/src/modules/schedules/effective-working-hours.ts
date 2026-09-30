import { Prisma, Weekday } from '@prisma/client';
import { DateTime } from 'luxon';

export type EffectiveWorkingHours = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export const orderedWeekdays: Weekday[] = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
  Weekday.SUNDAY,
];

export function workingHoursForDate(
  plannedHours: EffectiveWorkingHours[],
  previousHours: Prisma.JsonValue | null | undefined,
  effectiveFrom: Date | null | undefined,
  targetDate: DateTime,
) {
  if (
    effectiveFrom &&
    targetDate <
      DateTime.fromJSDate(effectiveFrom).setZone(targetDate.zoneName ?? 'UTC')
  ) {
    return parseStoredWorkingHours(previousHours) ?? plannedHours;
  }
  return plannedHours;
}

export function parseStoredWorkingHours(
  value: Prisma.JsonValue | null | undefined,
) {
  if (!Array.isArray(value)) return null;
  const hours: EffectiveWorkingHours[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
    const weekday = item.weekday;
    const startTime = item.startTime;
    const endTime = item.endTime;
    if (
      typeof weekday !== 'string' ||
      !orderedWeekdays.includes(weekday as Weekday) ||
      typeof startTime !== 'string' ||
      typeof endTime !== 'string'
    ) {
      return null;
    }
    hours.push({ weekday: weekday as Weekday, startTime, endTime });
  }
  return hours;
}

export function serializeWorkingHours(hours: EffectiveWorkingHours[]) {
  return hours.map(({ weekday, startTime, endTime }) => ({
    weekday,
    startTime,
    endTime,
  })) satisfies Prisma.InputJsonValue;
}
