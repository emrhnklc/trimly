import type { PublicBarbershop, PublicBarbershopDetail } from './types';
import { apiGet } from '@/lib/api/client';

export async function getPublicBarbershops(search?: string): Promise<PublicBarbershop[]> {
  return apiGet<PublicBarbershop[]>('/barbershops', { search: search?.trim() ?? '' });
}

export async function getPublicBarbershop(slug: string): Promise<PublicBarbershopDetail> {
  return apiGet<PublicBarbershopDetail>(`/barbershops/${encodeURIComponent(slug)}`);
}
