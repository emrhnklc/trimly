import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type {
  CreateManagementServiceInput,
  DailyBusinessSummary,
  ManagementService,
  UpdateManagementServiceInput,
} from './types';

export function getManagementServices(barbershopId: string, accessToken: string) {
  return apiGet<ManagementService[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/management`,
    undefined,
    accessToken,
  );
}

export function getManagementService(
  barbershopId: string,
  serviceId: string,
  accessToken: string,
) {
  return apiGet<ManagementService>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/management/${encodeURIComponent(serviceId)}`,
    undefined,
    accessToken,
  );
}

export function createManagementService(
  barbershopId: string,
  input: CreateManagementServiceInput,
  accessToken: string,
) {
  return apiPost<ManagementService>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services`,
    input,
    accessToken,
  );
}

export function updateManagementService(
  barbershopId: string,
  serviceId: string,
  input: UpdateManagementServiceInput,
  accessToken: string,
) {
  return apiPatch<ManagementService>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/${encodeURIComponent(serviceId)}`,
    input,
    accessToken,
  );
}

export function getDailyBusinessSummary(
  barbershopId: string,
  date: string,
  accessToken: string,
) {
  return apiGet<DailyBusinessSummary>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/daily-summary`,
    { date },
    accessToken,
  );
}
