export type RevenuePeriod = 'WEEK' | 'MONTH' | 'YEAR';

export type RevenuePoint = {
  key: string;
  label: string;
  completed: number;
  revenue: string;
};

export type MemberRevenueSummary = {
  memberId: string;
  name: string;
  completed: number;
  completedRevenue: string;
};

export type RevenueSummary = {
  period: RevenuePeriod;
  timezone: string;
  rangeStart: string;
  rangeEnd: string;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  totalRevenue: string;
  previousRevenue: string;
  changePercentage: number | null;
  averageTicket: string;
  points: RevenuePoint[];
  byMember: MemberRevenueSummary[];
};
