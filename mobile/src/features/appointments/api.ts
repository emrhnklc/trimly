import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type {
  CreateAppointmentInput,
  CreatedAppointment,
  CustomerAppointment,
  BusinessAppointment,
  BusinessAppointmentDetail,
} from './types';

export function getBusinessAppointments(barbershopId: string, accessToken: string) {
  return apiGet<BusinessAppointment[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments`,
    undefined,
    accessToken,
  );
}

export function getBusinessAppointment(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiGet<BusinessAppointmentDetail>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}`,
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
  reason = 'İşletme tarafından iptal edildi.',
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/cancel`,
    { reason },
    accessToken,
  );
}

export function markBusinessAppointmentNoShow(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/no-show`,
    undefined,
    accessToken,
  );
}

export function completeBusinessAppointment(
  barbershopId: string,
  appointmentId: string,
  accessToken: string,
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/complete`,
    undefined,
    accessToken,
  );
}

export function rescheduleBusinessAppointment(
  barbershopId: string,
  appointmentId: string,
  startsAt: string,
  accessToken: string,
) {
  return apiPatch<CreatedAppointment>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
    { startsAt },
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
