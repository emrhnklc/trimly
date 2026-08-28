import type {
  AvailabilityResult,
  BookableBarber,
  BookingSettings,
  PublicBarbershop,
  PublicBarbershopDetail,
} from './types';
import { apiGet } from '@/lib/api/client';

export async function getPublicBarbershops(search?: string): Promise<PublicBarbershop[]> {
  return apiGet<PublicBarbershop[]>('/barbershops', { search: search?.trim() ?? '' });
}

export async function getPublicBarbershop(slug: string): Promise<PublicBarbershopDetail> {
  return apiGet<PublicBarbershopDetail>(`/barbershops/${encodeURIComponent(slug)}`);
}

export function getBookableBarbers(barbershopId: string): Promise<BookableBarber[]> {
  return apiGet<BookableBarber[]>(`/barbershops/${barbershopId}/barbers`);
}

export function getBookingSettings(barbershopId: string): Promise<BookingSettings> {
  return apiGet<BookingSettings>(`/barbershops/${barbershopId}/booking-settings`);
}

export function getAvailability(barbershopId: string, memberId: string, serviceId: string, date: string) {
  return apiGet<AvailabilityResult>(`/barbershops/${barbershopId}/availability`, { memberId, serviceId, date });
}
