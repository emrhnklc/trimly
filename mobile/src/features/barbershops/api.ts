import type {
  AvailabilityResult,
  BarbershopAccessMode,
  BarbershopAccessResult,
  BarbershopAccessSettings,
  BookableBarber,
  BookingSettings,
  EditableBarbershopProfile,
  PublicBarbershop,
  PublicBarbershopDetail,
  PublicService,
  RotatedBarbershopAccessCode,
  UpdateBarbershopProfileInput,
  UpdateBookingSettingsInput,
} from "./types";
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";

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

export function createBarbershop(
  data: CreateBarbershopInput,
  accessToken: string,
) {
  return apiPost<CreatedBarbershop>("/barbershops", data, accessToken);
}

export async function getPublicBarbershops(
  search?: string,
): Promise<PublicBarbershop[]> {
  return apiGet<PublicBarbershop[]>("/barbershops", {
    search: search?.trim() ?? "",
  });
}

export async function getPublicBarbershop(
  slug: string,
): Promise<PublicBarbershopDetail> {
  return apiGet<PublicBarbershopDetail>(
    `/barbershops/${encodeURIComponent(slug)}`,
  );
}

export function getActiveServices(
  barbershopId: string,
  accessToken: string,
): Promise<PublicService[]> {
  return apiGet<PublicService[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services`,
    undefined,
    accessToken,
  );
}

export function getBookableBarbers(
  barbershopId: string,
  accessToken: string,
): Promise<BookableBarber[]> {
  return apiGet<BookableBarber[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/barbers`,
    undefined,
    accessToken,
  );
}

export function getBookingSettings(
  barbershopId: string,
): Promise<BookingSettings> {
  return apiGet<BookingSettings>(
    `/barbershops/${barbershopId}/booking-settings`,
  );
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

export function getAvailability(
  barbershopId: string,
  memberId: string,
  serviceId: string,
  date: string,
  accessToken: string,
) {
  return apiGet<AvailabilityResult>(
    `/barbershops/${encodeURIComponent(barbershopId)}/availability`,
    { memberId, serviceId, date },
    accessToken,
  );
}

export function redeemBarbershopAccess(
  slug: string,
  code: string,
  accessToken: string,
) {
  return apiPost<BarbershopAccessResult>(
    `/barbershops/${encodeURIComponent(slug)}/access`,
    { code },
    accessToken,
  );
}

export function getBarbershopAccessSettings(
  barbershopId: string,
  accessToken: string,
) {
  return apiGet<BarbershopAccessSettings>(
    `/barbershops/${encodeURIComponent(barbershopId)}/access-settings`,
    undefined,
    accessToken,
  );
}

export function updateBarbershopAccessSettings(
  barbershopId: string,
  accessMode: BarbershopAccessMode,
  accessToken: string,
) {
  return apiPatch<BarbershopAccessSettings>(
    `/barbershops/${encodeURIComponent(barbershopId)}/access-settings`,
    { accessMode },
    accessToken,
  );
}

export function rotateBarbershopAccessCode(
  barbershopId: string,
  accessToken: string,
) {
  return apiPost<RotatedBarbershopAccessCode>(
    `/barbershops/${encodeURIComponent(barbershopId)}/access-code/rotate`,
    {},
    accessToken,
  );
}
