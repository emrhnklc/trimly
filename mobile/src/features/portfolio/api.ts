import { apiGet, apiPatch, apiPost } from '@/lib/api/client';
import type { PortfolioPublication } from '@/features/appointments/types';
import type { PublicPortfolioItem } from './types';

export function getPublicPortfolio(barbershopId: string) {
  return apiGet<PublicPortfolioItem[]>(
    `/portfolio/barbershops/${encodeURIComponent(barbershopId)}`,
  );
}

export function requestPortfolioPublication(
  barbershopId: string,
  appointmentId: string,
  photoId: string,
  accessToken: string,
) {
  return apiPost<PortfolioPublication>(
    `/portfolio/barbershops/${encodeURIComponent(barbershopId)}/appointments/${encodeURIComponent(appointmentId)}/photos/${encodeURIComponent(photoId)}/request`,
    {},
    accessToken,
  );
}

export function respondToPortfolioRequest(
  requestId: string,
  action: 'approve' | 'reject' | 'revoke',
  accessToken: string,
) {
  return apiPatch<PortfolioPublication>(
    `/portfolio/requests/${encodeURIComponent(requestId)}/${action}`,
    undefined,
    accessToken,
  );
}
