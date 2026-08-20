import type { PublicBarbershop } from './types';
import { apiGet } from '@/lib/api/client';

export async function getPublicBarbershops(search?: string): Promise<PublicBarbershop[]> {
  return apiGet<PublicBarbershop[]>('/barbershops', { search: search?.trim() ?? '' });
}
