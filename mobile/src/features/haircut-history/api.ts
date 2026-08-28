import { apiGet } from '@/lib/api/client';
import type { CustomerHaircutRecord } from './types';

export function getMyHaircutHistory(accessToken: string) {
  return apiGet<CustomerHaircutRecord[]>('/haircut-records/me', undefined, accessToken);
}
