import { apiGet, apiPatch, apiPost, apiUpload } from "@/lib/api/client";
import { appendImageFile } from "@/lib/api/upload";
import type { CustomerHaircutRecord } from "./types";

export function getMyHaircutHistory(accessToken: string) {
  return apiGet<CustomerHaircutRecord[]>(
    "/haircut-records/me",
    undefined,
    accessToken,
    { fresh: true },
  );
}

export function saveBusinessHaircutRecord(
  barbershopId: string,
  appointmentId: string,
  input: { styleName?: string; notes?: string },
  accessToken: string,
) {
  return apiPost<{
    id: string;
    styleName: string | null;
    notes: string | null;
  }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/haircut-record`,
    input,
    accessToken,
  );
}

export function uploadBusinessHaircutPhoto(
  barbershopId: string,
  appointmentId: string,
  photo: { uri: string; mimeType?: string },
  accessToken: string,
) {
  const formData = new FormData();
  formData.append("customerConsentConfirmed", "true");
  appendImageFile(formData, "file", photo, "trimly");

  return apiUpload<{ id: string }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/haircut-record/photos`,
    formData,
    accessToken,
  );
}

export function finalizeBusinessHaircutRecord(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiPost<{ id: string; finalizedAt: string }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/haircut-record/finalize`,
    {},
    accessToken,
  );
}

export function uploadCustomerHaircutPhoto(
  appointmentId: string,
  photo: { uri: string; mimeType?: string | null },
  accessToken: string,
) {
  const formData = new FormData();
  appendImageFile(formData, "file", photo, "trimly-customer");

  return apiUpload<{ id: string }>(
    `/haircut-records/appointments/${encodeURIComponent(appointmentId)}/photos`,
    formData,
    accessToken,
  );
}

export function setGuardianPrivatePhotoConsent(
  appointmentId: string,
  allow: boolean,
  accessToken: string,
) {
  return apiPatch<{
    guardianPrivatePhotoConsentAt: string | null;
    deletedPhotoCount?: number;
  }>(
    `/haircut-records/appointments/${encodeURIComponent(appointmentId)}/guardian-photo-consent`,
    { allow },
    accessToken,
  );
}
