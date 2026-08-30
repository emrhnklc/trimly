import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client';
import type {
  BusinessInvitation,
  BusinessMember,
  CreateBusinessInvitationInput,
  UpdateBusinessMemberInput,
} from './types';

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

export function getBusinessMember(
  barbershopId: string,
  memberId: string,
  accessToken: string,
) {
  return apiGet<BusinessMember>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}`,
    undefined,
    accessToken,
  );
}

export function createBusinessInvitation(
  barbershopId: string,
  input: CreateBusinessInvitationInput,
  accessToken: string,
) {
  return apiPost<BusinessInvitation>(
    `/barbershops/${encodeURIComponent(barbershopId)}/invitations`,
    input,
    accessToken,
  );
}

export function updateBusinessMember(
  barbershopId: string,
  memberId: string,
  input: UpdateBusinessMemberInput,
  accessToken: string,
) {
  return apiPatch<Pick<BusinessMember, 'id' | 'role' | 'isActive' | 'isBookable'>>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}`,
    input,
    accessToken,
  );
}

export function updateBusinessMemberBookable(
  barbershopId: string,
  memberId: string,
  isBookable: boolean,
  accessToken: string,
) {
  return apiPut<Pick<BusinessMember, 'id' | 'isActive' | 'isBookable'>>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/bookable`,
    { isBookable },
    accessToken,
  );
}

export function assignBusinessMemberService(
  barbershopId: string,
  memberId: string,
  serviceId: string,
  accessToken: string,
) {
  return apiPut<{ businessMemberId: string; serviceId: string }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/services/${encodeURIComponent(serviceId)}`,
    undefined,
    accessToken,
  );
}

export function unassignBusinessMemberService(
  barbershopId: string,
  memberId: string,
  serviceId: string,
  accessToken: string,
) {
  return apiDelete<{ success: boolean }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/services/${encodeURIComponent(serviceId)}`,
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
