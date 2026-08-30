import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type {
  CreateAppointmentInput,
  CreatedAppointment,
  CustomerAppointment,
  BusinessAppointment,
} from './types';

export function getBusinessAppointments(barbershopId: string, accessToken: string) {
  return apiGet<BusinessAppointment[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments`,
    undefined,
    accessToken,
  );
}

export function markBusinessAppointmentArrived(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/arrived`,
    undefined,
    accessToken,
  );
}

export function undoBusinessAppointmentArrival(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/undo-arrival`,
    undefined,
    accessToken,
  );
}

export function cancelBusinessAppointment(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    { reason: 'İşletme tarafından iptal edildi.' },
    accessToken,
  );
}

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
