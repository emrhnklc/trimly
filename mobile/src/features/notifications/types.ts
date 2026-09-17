export type AppNotificationType =
  | 'NEW_APPOINTMENT'
  | 'APPOINTMENT_REMINDER'
  | 'PORTFOLIO_CONSENT_REQUEST';

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
