export type AppointmentStatus = 'CONFIRMED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type CreateAppointmentInput = {
  memberId: string;
  serviceId: string;
  startsAt: string;
};

export type CreatedAppointment = {
  id: string;
  barbershopId: string;
  businessMemberId: string;
  customerId: string;
  serviceId: string;
  serviceNameSnapshot: string;
  priceSnapshot: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  arrivedAt?: string | null;
  autoCompleteAt?: string | null;
};

export type BusinessAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  arrivedAt: string | null;
  autoCompleteAt: string | null;
  completedAt: string | null;
  serviceNameSnapshot: string;
  priceSnapshot: string;
  durationMinutes: number;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    profileImageUrl: string | null;
  };
  businessMember: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
};

export type BusinessAppointmentDetail = BusinessAppointment & {
  serviceId: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  completedVisitCount: number;
  barbershop: {
    id: string;
    name: string;
    timezone: string;
  };
  businessMember: BusinessAppointment['businessMember'] & {
    user: BusinessAppointment['businessMember']['user'] & {
      profileImageUrl: string | null;
    };
  };
  haircutRecord: {
    styleName: string | null;
    notes: string | null;
  } | null;
};

export type CustomerAppointment = {
  id: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  serviceNameSnapshot: string;
  priceSnapshot: string;
  durationMinutes: number;
  cancelledAt: string | null;
  completedAt: string | null;
  canCancel: boolean;
  cancellationDeadline: string;
  cancellationNoticeMinutes: number;
  cancellationReason: string | null;
  barbershop: {
    id: string;
    name: string;
    slug: string;
  };
  businessMember: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
  };
};
