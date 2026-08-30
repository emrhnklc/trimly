import { apiGet } from '@/lib/api/client';
import type { BusinessWorkingHours } from './types';

export function getBusinessWorkingHours(barbershopId: string) {
  return apiGet<BusinessWorkingHours[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/working-hours`,
  );
}
