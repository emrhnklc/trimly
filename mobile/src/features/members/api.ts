import { apiPost } from '@/lib/api/client';
type AcceptedBusinessInvitation = {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'BARBER' | 'APPRENTICE';
  isBookable: boolean;
  barbershop: { id: string; name: string; slug: string };
};

export function acceptBusinessInvitation(token: string, accessToken: string) {
  return apiPost<AcceptedBusinessInvitation>(
    `/invitations/${encodeURIComponent(token)}/accept`,
    {},
    accessToken,
  );
}
