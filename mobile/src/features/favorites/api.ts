import { apiDelete, apiGet, apiPut } from '@/lib/api/client';
import type { FavoriteBarbershop } from './types';

type FavoriteMutationResult = {
  id: string;
  userId: string;
  barbershopId: string;
  createdAt: string;
};

export function getFavoriteBarbershops(accessToken: string) {
  return apiGet<FavoriteBarbershop[]>('/favorites/barbershops', undefined, accessToken);
}

export function addFavoriteBarbershop(barbershopId: string, accessToken: string) {
  return apiPut<FavoriteMutationResult>(
    `/favorites/barbershops/${encodeURIComponent(barbershopId)}`,
    undefined,
    accessToken,
  );
}

export function removeFavoriteBarbershop(barbershopId: string, accessToken: string) {
  return apiDelete<{ success: true }>(
    `/favorites/barbershops/${encodeURIComponent(barbershopId)}`,
    accessToken,
  );
}
