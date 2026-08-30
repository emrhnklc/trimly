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
