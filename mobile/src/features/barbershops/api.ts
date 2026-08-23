import type { PublicBarbershop, PublicBarbershopDetail } from './types';
import { apiGet } from '@/lib/api/client';

export async function getPublicBarbershops(search?: string): Promise<PublicBarbershop[]> {
  return apiGet<PublicBarbershop[]>('/barbershops', { search: search?.trim() ?? '' });
}

export async function getPublicBarbershop(slug: string): Promise<PublicBarbershopDetail> {
  return apiGet<PublicBarbershopDetail>(`/barbershops/${encodeURIComponent(slug)}`);
}

export type AvailabilityResult = { date: string; slots: { startTime: string; startsAt: string; endsAt: string }[] };

export function getAvailability(barbershopId: string, memberId: string, serviceId: string, date: string) {
  return apiGet<AvailabilityResult>(`/barbershops/${barbershopId}/availability`, { memberId, serviceId, date });
}
