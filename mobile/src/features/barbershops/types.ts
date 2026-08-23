export type PublicBarbershop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  address: string | null;
};

export type PublicBarbershopDetail = PublicBarbershop & {
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
