import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type {
  CreateAppointmentInput,
  CreatedAppointment,
  CustomerAppointment,
} from './types';

export function createAppointment(
  barbershopId: string,
  input: CreateAppointmentInput,
  accessToken: string,
) {
  return apiPost<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments`,
    input,
    accessToken,
  );
}

export function getMyAppointments(accessToken: string) {
  return apiGet<CustomerAppointment[]>('/appointments/me', undefined, accessToken);
}

export function getMyAppointment(appointmentId: string, accessToken: string) {
  return apiGet<CustomerAppointment>(
    `/appointments/${encodeURIComponent(appointmentId)}`,
    undefined,
    accessToken,
  );
}

export function cancelMyAppointment(appointmentId: string, accessToken: string) {
  return apiPatch<CreatedAppointment>(
    `/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    undefined,
    accessToken,
  );
}
