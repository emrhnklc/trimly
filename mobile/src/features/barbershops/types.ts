export type PublicBarbershop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  address: string | null;
};

export type PublicBarbershopDetail = PublicBarbershop & {
  coverImageUrl: string | null;
  members: PublicBarber[];
  phone: string | null;
  services: PublicService[];
  timezone: string;
};

export type PublicBarber = {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'BARBER';
  user: { firstName: string; lastName: string; profileImageUrl: string | null };
};

export type PublicService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: string;
};

export type BookableBarber = {
  id: string;
  user: { firstName: string; lastName: string; profileImageUrl: string | null };
  serviceAssignments: {
    service: Pick<PublicService, 'id' | 'name' | 'durationMinutes'>;
  }[];
};

export type BookingSettings = {
  minBookingNoticeMinutes: number;
  maxBookingAdvanceDays: number;
  slotIntervalMinutes: number;
};

export type AvailabilitySlot = {
  startTime: string;
  startsAt: string;
  endsAt: string;
};

export type AvailabilityResult = {
  date: string;
  slots: AvailabilitySlot[];
};
