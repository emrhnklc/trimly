export type BusinessRole = 'OWNER' | 'MANAGER' | 'BARBER' | 'APPRENTICE';

export type BusinessMembership = {
  id: string;
  role: BusinessRole;
  isActive: boolean;
  isBookable: boolean;
  barbershop: {
    id: string;
    name: string;
    slug: string;
    profileImageUrl: string | null;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  profileImageUrl: string | null;
  businessMemberships: BusinessMembership[];
};
export type AuthResponse = { accessToken: string; user: AuthUser };
