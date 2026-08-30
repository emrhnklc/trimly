export type BusinessCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  totalAppointmentCount: number;
  completedVisitCount: number;
  firstAppointmentAt: string;
  lastAppointmentAt: string;
  lastVisitAt: string | null;
  nextAppointmentAt: string | null;
};
