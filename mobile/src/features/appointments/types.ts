export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

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
};

export type CustomerAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  serviceNameSnapshot: string;
  priceSnapshot: string;
  durationMinutes: number;
  cancelledAt: string | null;
  completedAt: string | null;
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
