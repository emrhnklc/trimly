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

export type BusinessCustomerVisit = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'CONFIRMED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  serviceNameSnapshot: string;
  priceSnapshot: string;
  durationMinutes: number;
  cancellationReason: string | null;
  businessMember: {
    id: string;
    user: { firstName: string; lastName: string };
  };
  haircutRecord: {
    styleName: string | null;
    notes: string | null;
  } | null;
};

export type BusinessCustomerDetail = BusinessCustomer & {
  appointments: BusinessCustomerVisit[];
};
