import { apiGet } from '@/lib/api/client';
import type { BusinessCustomer, BusinessCustomerDetail } from './types';

export function getBusinessCustomers(barbershopId: string, accessToken: string) {
  return apiGet<BusinessCustomer[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/customers`,
    undefined,
    accessToken,
  );
}

export function getBusinessCustomer(
  barbershopId: string,
  customerId: string,
  accessToken: string,
) {
  return apiGet<BusinessCustomerDetail>(
    `/barbershops/${encodeURIComponent(barbershopId)}/customers/${encodeURIComponent(customerId)}`,
    undefined,
    accessToken,
  );
}
