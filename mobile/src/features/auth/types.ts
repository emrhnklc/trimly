export type BusinessRole = "OWNER" | "MANAGER" | "BARBER" | "APPRENTICE";

export type BusinessMembership = {
  id: string;
  role: BusinessRole;
  isActive: boolean;
  isBookable: boolean;
  barbershop: {
    id: string;
    isDiscoverable: boolean;
    name: string;
    slug: string;
    profileImageUrl: string | null;
    timezone: string;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  birthDate: string | null;
  provinceCode: string | null;
  province: string | null;
  district: string | null;
  neighborhood: string | null;
  profileImageUrl: string | null;
  businessMemberships: BusinessMembership[];
};
export type AuthResponse = { accessToken: string; user: AuthUser };

export type EmailVerificationPendingResponse = {
  email: string;
  expiresAt?: string;
  verificationRequired?: true;
  devVerificationCode?: string;
  message?: string;
};

export type PasswordResetRequestResponse = {
  message: string;
  expiresAt?: string;
  devResetCode?: string;
};
