import { apiGet, apiPost } from '@/lib/api/client';
import type { BusinessMember } from './types';

type AcceptedBusinessInvitation = {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'BARBER' | 'APPRENTICE';
  isBookable: boolean;
  barbershop: { id: string; name: string; slug: string };
};

export function getBusinessMembers(barbershopId: string, accessToken: string) {
  return apiGet<BusinessMember[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members`,
    undefined,
    accessToken,
  );
}

export function acceptBusinessInvitation(token: string, accessToken: string) {
  return apiPost<AcceptedBusinessInvitation>(
    `/invitations/${encodeURIComponent(token)}/accept`,
    {},
    accessToken,
  );
}
