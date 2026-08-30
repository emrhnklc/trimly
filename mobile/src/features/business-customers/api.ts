import { apiGet } from '@/lib/api/client';
import type { BusinessCustomer } from './types';

export function getBusinessCustomers(barbershopId: string, accessToken: string) {
  return apiGet<BusinessCustomer[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/customers`,
    undefined,
    accessToken,
  );
}
