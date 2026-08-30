import { apiGet, apiPut } from '@/lib/api/client';
import type { BusinessWorkingHours, UpdateBusinessWorkingHoursInput } from './types';

export function getBusinessWorkingHours(barbershopId: string) {
  return apiGet<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours`,
  );
}

export function updateBusinessWorkingHours(
  barbershopId: string,
  input: UpdateBusinessWorkingHoursInput,
  accessToken: string,
) {
  return apiPut<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours`,
    input,
    accessToken,
  );
}
