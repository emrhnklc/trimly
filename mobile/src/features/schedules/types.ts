export type Weekday =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type BusinessWorkingHours = {
  weekday: Weekday;
  startTime: string;
  endTime: string;
};

export type UpdateBusinessWorkingHoursInput = {
  hours: BusinessWorkingHours[];
};

export type ScheduleBlockType = 'BREAK' | 'TIME_OFF';

export type MemberScheduleBlock = {
  id: string;
  type: ScheduleBlockType;
  startsAt: string;
  endsAt: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMemberScheduleBlockInput = {
  type: ScheduleBlockType;
  startsAt: string;
  endsAt: string;
  note?: string;
};
