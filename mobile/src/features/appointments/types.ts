export type AppointmentStatus = 'CONFIRMED' | 'ARRIVED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type AppointmentChangeProposal = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  proposedStartsAt: string;
  proposedEndsAt: string;
  proposedDurationMinutes: number;
  proposedPrice: string;
  reason: string;
  proposedService: { id: string };
  proposedServiceName: string;
  proposedBusinessMember: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl: string | null;
    };
  };
  expiresAt: string;
  createdAt: string;
};

export type PortfolioPublication = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVOKED';
  title: string | null;
  requestedAt: string;
  respondedAt: string | null;
  revokedAt: string | null;
};

export type AppointmentReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  photos: ReviewPhoto[];
};

export type ReviewPhoto = {
  id: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  url: string;
};

export type CreateAppointmentInput = {
  memberId: string;
  serviceId: string;
  startsAt: string;
  campaignId?: string;
  dependentProfileId?: string;
};

export type CreatedAppointment = {
  id: string;
  barbershopId: string;
  businessMemberId: string;
  customerId: string;
  dependentProfileId?: string | null;
  attendeeNameSnapshot?: string;
  appointmentLocalDate?: string;
  serviceId: string;
  campaignId?: string | null;
  campaignTitleSnapshot?: string | null;
  campaignBenefitSnapshot?: string | null;
  serviceNameSnapshot: string;
  originalPriceSnapshot?: string;
  discountAmount?: string;
  priceSnapshot: string;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  arrivedAt?: string | null;
  autoCompleteAt?: string | null;
  completedAt?: string | null;
};

export type BusinessAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  arrivedAt: string | null;
  autoCompleteAt: string | null;
  completedAt: string | null;
  dependentProfileId: string | null;
  attendeeNameSnapshot: string;
  appointmentLocalDate: string;
  haircutRecord: {
    id: string;
    finalizedAt: string | null;
  } | null;
  serviceNameSnapshot: string;
  campaignTitleSnapshot?: string | null;
  campaignBenefitSnapshot?: string | null;
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
  changeProposal: AppointmentChangeProposal | null;
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
    id: string;
    styleName: string | null;
    notes: string | null;
    finalizedAt: string | null;
    photos: {
      id: string;
      mimeType: string;
      sizeBytes: number;
      sortOrder: number;
      url: string | null;
      portfolioItem: PortfolioPublication | null;
    }[];
  } | null;
};

export type CustomerAppointment = {
  id: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  serviceNameSnapshot: string;
  campaignId?: string | null;
  campaignTitleSnapshot?: string | null;
  campaignBenefitSnapshot?: string | null;
  originalPriceSnapshot?: string;
  discountAmount?: string;
  priceSnapshot: string;
  durationMinutes: number;
  cancelledAt: string | null;
  completedAt: string | null;
  dependentProfileId: string | null;
  attendeeNameSnapshot: string;
  appointmentLocalDate: string;
  canCancel: boolean;
  cancellationDeadline: string;
  cancellationNoticeMinutes: number;
  cancellationReason: string | null;
  changeProposal?: AppointmentChangeProposal | null;
  review?: AppointmentReview | null;
  haircutRecord?: {
    id: string;
    styleName: string | null;
    notes: string | null;
    photos: {
      id: string;
      mimeType: string;
      sizeBytes: number;
      sortOrder: number;
      url: string;
      portfolioItem: PortfolioPublication | null;
    }[];
  } | null;
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
