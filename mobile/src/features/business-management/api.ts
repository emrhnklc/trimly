import { apiGet } from '@/lib/api/client';
import type { DailyBusinessSummary, ManagementService } from './types';

export function getManagementServices(barbershopId: string, accessToken: string) {
  return apiGet<ManagementService[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/services/management`,
    undefined,
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
