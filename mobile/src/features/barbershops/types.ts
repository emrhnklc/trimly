export type PublicBarbershop = {
  accessMode: "PUBLIC" | "CODE_REQUIRED";
  id: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  isDiscoverable: boolean;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt?: string;
  members?: PublicBarber[];
};

export type BarbershopAccessResult = {
  accessGranted: boolean;
  alreadyGranted: boolean;
  barbershopId: string;
  slug: string;
};

export type BarbershopAccessMode = "PUBLIC" | "CODE_REQUIRED";

export type BarbershopAccessSettings = {
  id: string;
  accessMode: BarbershopAccessMode;
  isDiscoverable: boolean;
  hasAccessCode: boolean;
  accessCodeUpdatedAt: string | null;
};

export type RotatedBarbershopAccessCode = {
  code: string;
  updatedAt: string;
};

export type PublicBarbershopDetail = PublicBarbershop & {
  members: PublicBarber[];
  phone: string | null;
  services: PublicService[];
  timezone: string;
};

export type PublicBarber = {
  id: string;
  role: "OWNER" | "MANAGER" | "BARBER";
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
    service: Pick<PublicService, "id" | "name" | "durationMinutes">;
  }[];
};

export type BookingSettings = {
  minBookingNoticeMinutes: number;
  maxBookingAdvanceDays: number;
  slotIntervalMinutes: number;
  customerCancellationEnabled: boolean;
  cancellationNoticeMinutes: number;
};

export type UpdateBookingSettingsInput = Pick<
  BookingSettings,
  | "minBookingNoticeMinutes"
  | "maxBookingAdvanceDays"
  | "slotIntervalMinutes"
  | "customerCancellationEnabled"
  | "cancellationNoticeMinutes"
>;

export type UpdateBarbershopProfileInput = {
  name: string;
  description: string;
  phone: string;
  address: string;
  profileImageUrl: string;
  coverImageUrl: string;
  isDiscoverable: boolean;
};

export type EditableBarbershopProfile = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  isDiscoverable: boolean;
  timezone: string;
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
