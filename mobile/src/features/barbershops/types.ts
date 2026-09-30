export type PublicBarbershop = {
  accessMode: "PUBLIC" | "CODE_REQUIRED";
  id: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  isDiscoverable: boolean;
  isBookingOpen?: boolean;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt?: string;
  members?: PublicBarber[];
  serviceNames?: string[];
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
  isBookingOpen: boolean;
  galleryPhotos: { id: string; sortOrder: number; url: string }[];
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
  pendingSlotIntervalMinutes?: number | null;
  slotIntervalEffectiveFrom?: string | null;
};

export type BarbershopReadinessRequirement =
  | "LOCATION"
  | "PHONE"
  | "PROFILE_PHOTO"
  | "COVER_PHOTO"
  | "GALLERY_PHOTOS"
  | "ACTIVE_SERVICE"
  | "BOOKABLE_MEMBER"
  | "BUSINESS_HOURS"
  | "MEMBER_WORKING_HOURS";

export type BarbershopReadiness = {
  acceptsBookings: boolean;
  isBookingOpen: boolean;
  isDiscoverable: boolean;
  isReadyToPublish: boolean;
  checks: {
    location: boolean;
    phone: boolean;
    profilePhoto: boolean;
    coverPhoto: boolean;
    galleryPhotos: boolean;
    activeService: boolean;
    bookableMember: boolean;
    businessHours: boolean;
    memberWorkingHours: boolean;
  };
  missingRequirements: {
    code: BarbershopReadinessRequirement;
    label: string;
  }[];
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
  acceptsBookings?: boolean;
  name: string;
  description: string;
  phone: string;
  address: string;
  profileImageUrl: string;
  coverImageUrl: string;
  isDiscoverable: boolean;
  latitude: number | null;
  longitude: number | null;
};

export type EditableBarbershopProfile = {
  acceptsBookings: boolean;
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  isDiscoverable: boolean;
  latitude: number | null;
  longitude: number | null;
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
