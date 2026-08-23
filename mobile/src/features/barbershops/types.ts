export type PublicBarbershop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  profileImageUrl: string | null;
  address: string | null;
};

export type PublicBarbershopDetail = PublicBarbershop & {
  phone: string | null;
  timezone: string;
};
