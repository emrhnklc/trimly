import type { PublicBarbershop } from '@/features/barbershops/types';

export type FavoriteBarbershop = {
  createdAt: string;
  barbershop: PublicBarbershop;
};
