import { apiGet, apiPost, apiUpload } from '@/lib/api/client';
import type { CustomerHaircutRecord } from './types';

export function getMyHaircutHistory(accessToken: string) {
  return apiGet<CustomerHaircutRecord[]>('/haircut-records/me', undefined, accessToken);
}

export function saveBusinessHaircutRecord(
  barbershopId: string,
  appointmentId: string,
  input: { styleName?: string; notes?: string },
  accessToken: string,
) {
  return apiPost<{ id: string; styleName: string | null; notes: string | null }>(
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
  formData.append('customerConsentConfirmed', 'true');
  formData.append('file', {
    uri: photo.uri,
    name: `trimly-${Date.now()}.jpg`,
    type: photo.mimeType ?? 'image/jpeg',
  } as unknown as Blob);

  return apiUpload<{ id: string }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/haircut-record/photos`,
    formData,
    accessToken,
  );
}
