import { apiGet } from '@/lib/api/client';
import type { RevenuePeriod, RevenueSummary } from './types';

export function getRevenueSummary(
  barbershopId: string,
  period: RevenuePeriod,
  anchor: string,
  accessToken: string,
) {
  return apiGet<RevenueSummary>(
    `/barbershops/${encodeURIComponent(barbershopId)}/appointments/revenue-summary`,
    { anchor, period },
    accessToken,
  );
}
