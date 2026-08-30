export type ManagementService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateManagementServiceInput = {
  name: string;
  description?: string;
  durationMinutes: number;
  price: string;
};

export type UpdateManagementServiceInput = Partial<CreateManagementServiceInput> & {
  isActive?: boolean;
};

export type DailyBusinessSummary = {
  date: string;
  timezone: string;
  total: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completedRevenue: string;
  byMember: {
    memberId: string;
    name: string;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    completedRevenue: string;
  }[];
};
