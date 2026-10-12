export type AppNotificationType =
  | 'NEW_APPOINTMENT'
  | 'APPOINTMENT_REMINDER'
  | 'PORTFOLIO_CONSENT_REQUEST'
  | 'APPOINTMENT_CHANGE_PROPOSAL'
  | 'APPOINTMENT_NO_SHOW'
  | 'APPOINTMENT_BUSINESS_CANCELLED'
  | 'BUSINESS_RELIABILITY_POINTS_ADDED'
  | 'BUSINESS_CANCELLATION_APPEAL_DECISION';

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
  barbershop: {
    id: string;
    name: string;
  };
  appointment: {
    id: string;
  };
};
