import { apiDelete, apiGet, apiPut } from '@/lib/api/client';
import type { FavoriteBarbershop, FavoriteStyle } from './types';

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

export function getFavoriteStyles(accessToken: string) {
  return apiGet<FavoriteStyle[]>('/favorites/styles', undefined, accessToken);
}

export function addFavoriteStyle(photoId: string, accessToken: string) {
  return apiPut<FavoriteMutationResult>(
    `/favorites/styles/${encodeURIComponent(photoId)}`,
    undefined,
    accessToken,
  );
}

export function removeFavoriteStyle(photoId: string, accessToken: string) {
  return apiDelete<FavoriteMutationResult>(
    `/favorites/styles/${encodeURIComponent(photoId)}`,
    accessToken,
  );
}

export function addFavoritePortfolioItem(portfolioItemId: string, accessToken: string) {
  return apiPut<FavoriteMutationResult>(
    `/favorites/styles/portfolio/${encodeURIComponent(portfolioItemId)}`,
    undefined,
    accessToken,
  );
}

export function removeFavoritePortfolioItem(portfolioItemId: string, accessToken: string) {
  return apiDelete<FavoriteMutationResult>(
    `/favorites/styles/portfolio/${encodeURIComponent(portfolioItemId)}`,
    accessToken,
  );
}
