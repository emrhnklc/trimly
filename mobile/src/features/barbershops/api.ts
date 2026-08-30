import type {
  AvailabilityResult,
  BookableBarber,
  BookingSettings,
  EditableBarbershopProfile,
  PublicBarbershop,
  PublicBarbershopDetail,
  UpdateBarbershopProfileInput,
  UpdateBookingSettingsInput,
} from './types';
import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client';

export type CreateBarbershopInput = {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
};

export type CreatedBarbershop = {
  id: string;
  name: string;
  slug: string;
};

export function createBarbershop(data: CreateBarbershopInput, accessToken: string) {
  return apiPost<CreatedBarbershop>('/barbershops', data, accessToken);
}

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

export function updateBookingSettings(
  barbershopId: string,
  input: UpdateBookingSettingsInput,
  accessToken: string,
): Promise<BookingSettings> {
  return apiPut<BookingSettings>(
    `/barbershops/${encodeURIComponent(barbershopId)}/booking-settings`,
    input,
    accessToken,
  );
}

export function updateBarbershopProfile(
  barbershopId: string,
  input: UpdateBarbershopProfileInput,
  accessToken: string,
) {
  return apiPatch<EditableBarbershopProfile>(
    `/barbershops/${encodeURIComponent(barbershopId)}`,
    input,
    accessToken,
  );
}

export function getAvailability(barbershopId: string, memberId: string, serviceId: string, date: string) {
  return apiGet<AvailabilityResult>(`/barbershops/${barbershopId}/availability`, { memberId, serviceId, date });
}
