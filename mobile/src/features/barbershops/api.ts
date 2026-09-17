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
import { apiGet, apiPatch, apiPost, apiPut, apiUpload } from "@/lib/api/client";
import { appendImageFile } from "@/lib/api/upload";

export type CreateBarbershopInput = {
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
};

export type CreatedBarbershop = {
  id: string;
  name: string;
  slug: string;
};

export function getBarbershopSlugAvailability(slug: string) {
  return apiGet<{ available: boolean }>(
    `/barbershops/slug-availability/${encodeURIComponent(slug)}`,
  );
}

export function createBarbershop(
  data: CreateBarbershopInput,
  accessToken: string,
) {
  return apiPost<CreatedBarbershop>("/barbershops", data, accessToken);
}

export function createBarbershopWithPhotos(
  data: CreateBarbershopInput,
  profilePhoto: { uri: string; mimeType?: string | null },
  galleryPhotos: { uri: string; mimeType?: string | null }[],
  accessToken: string,
) {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("slug", data.slug);
  if (data.address) formData.append("address", data.address);
  if (data.phone) formData.append("phone", data.phone);
  if (data.latitude !== undefined)
    formData.append("latitude", data.latitude.toString());
  if (data.longitude !== undefined)
    formData.append("longitude", data.longitude.toString());
  appendImageFile(formData, "profilePhoto", profilePhoto, "profile");
  galleryPhotos.forEach((photo, index) =>
    appendImageFile(formData, "galleryPhotos", photo, `gallery-${index + 1}`),
  );
  return apiUpload<CreatedBarbershop>(
    "/barbershops/onboarding",
    formData,
    accessToken,
  );
}

export function uploadBarbershopProfilePhoto(
  barbershopId: string,
  photo: { uri: string; mimeType?: string | null },
  accessToken: string,
) {
  const formData = new FormData();
  appendImageFile(formData, "file", photo, "profile");
  return apiUpload<EditableBarbershopProfile>(
    `/barbershops/${encodeURIComponent(barbershopId)}/profile-photo`,
    formData,
    accessToken,
  );
}

export function uploadBarbershopGalleryPhotos(
  barbershopId: string,
  photos: { uri: string; mimeType?: string | null }[],
  accessToken: string,
) {
  const formData = new FormData();
  photos.forEach((photo, index) =>
    appendImageFile(formData, "files", photo, `gallery-${index + 1}`),
  );
  return apiUpload<EditableBarbershopProfile>(
    `/barbershops/${encodeURIComponent(barbershopId)}/gallery-photos`,
    formData,
    accessToken,
  );
}

export function uploadBarbershopCoverPhoto(
  barbershopId: string,
  photo: { uri: string; mimeType?: string | null },
  accessToken: string,
) {
  const formData = new FormData();
  appendImageFile(formData, "file", photo, "cover");
  return apiUpload<EditableBarbershopProfile>(
    `/barbershops/${encodeURIComponent(barbershopId)}/cover-photo`,
    formData,
    accessToken,
  );
}

export async function getPublicBarbershops(
  search?: string,
  location?: { latitude: number; longitude: number },
): Promise<PublicBarbershop[]> {
  return apiGet<PublicBarbershop[]>("/barbershops", {
    search: search?.trim() ?? "",
    latitude: location?.latitude.toString() ?? "",
    longitude: location?.longitude.toString() ?? "",
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
