import type { AppointmentReview } from '@/features/appointments/types';

export type PublicAppointmentReview = AppointmentReview & {
  customer: {
    displayName: string;
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

export type BarbershopReviews = {
  ratingAverage: number | null;
  ratingCount: number;
  reviews: PublicAppointmentReview[];
};
