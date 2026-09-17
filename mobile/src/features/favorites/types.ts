import type { PublicBarbershop } from '@/features/barbershops/types';

export type FavoriteBarbershop = {
  createdAt: string;
  barbershop: PublicBarbershop;
};

export type FavoriteStyle = {
  createdAt: string;
  kind: 'PORTFOLIO' | 'LEGACY_GALLERY';
  sourceId: string;
  title: string | null;
  photo: { id: string; url: string };
  barbershop: { id: string; name: string; slug: string };
};
