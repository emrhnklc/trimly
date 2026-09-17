import { apiDelete, apiGet, apiPut, apiUpload } from '@/lib/api/client';
import { appendImageFile } from '@/lib/api/upload';
import type { AppointmentReview, ReviewPhoto } from '@/features/appointments/types';
import type { BarbershopReviews } from './types';

export function saveAppointmentReview(
  appointmentId: string,
  input: { rating: number; comment?: string },
  accessToken: string,
) {
  return apiPut<AppointmentReview>(
    `/reviews/appointments/${encodeURIComponent(appointmentId)}`,
    input,
    accessToken,
  );
}

export function uploadAppointmentReviewPhoto(
  appointmentId: string,
  photo: { uri: string; mimeType?: string | null },
  accessToken: string,
) {
  const formData = new FormData();
  appendImageFile(formData, 'file', photo, 'trimly-review');
  return apiUpload<ReviewPhoto>(
    `/reviews/appointments/${encodeURIComponent(appointmentId)}/photos`,
    formData,
    accessToken,
  );
}

export function removeAppointmentReviewPhoto(
  appointmentId: string,
  photoId: string,
  accessToken: string,
) {
  return apiDelete<{ deleted: true }>(
    `/reviews/appointments/${encodeURIComponent(appointmentId)}/photos/${encodeURIComponent(photoId)}`,
    accessToken,
  );
}

export function removeAppointmentReview(appointmentId: string, accessToken: string) {
  return apiDelete<{ deleted: true }>(
    `/reviews/appointments/${encodeURIComponent(appointmentId)}`,
    accessToken,
  );
}

export function getBarbershopReviews(barbershopId: string) {
  return apiGet<BarbershopReviews>(
    `/reviews/barbershops/${encodeURIComponent(barbershopId)}`,
  );
}
