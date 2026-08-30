import type { Weekday } from '@/features/schedules/types';

export type WorkingDayDraft = {
  weekday: Weekday;
  isOpen: boolean;
  startTime: string;
  endTime: string;
};
