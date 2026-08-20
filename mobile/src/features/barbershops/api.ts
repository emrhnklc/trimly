import type { PublicBarbershop } from './types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function getPublicBarbershops(search?: string): Promise<PublicBarbershop[]> {
  const query = search?.trim();
  const url = new URL('/barbershops', API_URL);

  if (query) {
    url.searchParams.set('search', query);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('İşletmeler şu an yüklenemedi. Lütfen tekrar dene.');
  }

  return response.json() as Promise<PublicBarbershop[]>;
}
