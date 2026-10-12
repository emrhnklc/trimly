import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/client";
import type {
  BusinessInvitation,
  BusinessInvitationPreview,
  BusinessInvitationSummary,
  BusinessMember,
  CustomerBarbershopAccess,
  CreateBusinessInvitationInput,
  UpdateBusinessMemberInput,
  MemberAppointmentImpact,
} from "./types";

type AcceptedBusinessInvitation = {
  id: string;
  role: "OWNER" | "MANAGER" | "BARBER" | "APPRENTICE";
  isBookable: boolean;
  barbershop: { id: string; name: string; slug: string };
};

export function getBusinessMembers(barbershopId: string, accessToken: string) {
  return apiGet<unknown>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members`,
    undefined,
    accessToken,
  ).then((members) => {
    if (!Array.isArray(members) || !members.every(isBusinessMember)) {
      throw new Error("Çalışan verisi eksik geldi. Lütfen tekrar dene.");
    }

    return members;
  });
}

export function getBusinessMember(
  barbershopId: string,
  memberId: string,
  accessToken: string,
) {
  return apiGet<unknown>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}`,
    undefined,
    accessToken,
  ).then((member) => {
    if (!isBusinessMember(member)) {
      throw new Error("Çalışan verisi eksik geldi. Lütfen tekrar dene.");
    }

    return member;
  });
}

function isBusinessMember(value: unknown): value is BusinessMember {
  if (!value || typeof value !== "object") return false;

  const member = value as Partial<BusinessMember>;
  const user = member.user;

  return Boolean(
    typeof member.id === "string" &&
    typeof member.isActive === "boolean" &&
    typeof member.isBookable === "boolean" &&
    user &&
    typeof user.id === "string" &&
    typeof user.firstName === "string" &&
    typeof user.lastName === "string",
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

export function getBusinessInvitations(
  barbershopId: string,
  accessToken: string,
) {
  return apiGet<BusinessInvitationSummary[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/invitations`,
    undefined,
    accessToken,
  );
}

export function revokeBusinessInvitation(
  barbershopId: string,
  invitationId: string,
  accessToken: string,
) {
  return apiDelete<{ revoked: true }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/invitations/${encodeURIComponent(invitationId)}`,
    accessToken,
  );
}

export function getBusinessInvitationPreview(token: string) {
  return apiGet<BusinessInvitationPreview>(
    `/invitations/${encodeURIComponent(token)}`,
  );
}

export function getCustomerBarbershopAccesses(
  barbershopId: string,
  accessToken: string,
) {
  return apiGet<CustomerBarbershopAccess[]>(
    `/barbershops/${encodeURIComponent(barbershopId)}/customer-accesses`,
    undefined,
    accessToken,
  );
}

export function revokeCustomerBarbershopAccess(
  barbershopId: string,
  customerId: string,
  accessToken: string,
) {
  return apiDelete<{ revoked: true }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/customer-accesses/${encodeURIComponent(customerId)}`,
    accessToken,
  );
}

export function updateBusinessMember(
  barbershopId: string,
  memberId: string,
  input: UpdateBusinessMemberInput,
  accessToken: string,
) {
  return apiPatch<
    Pick<BusinessMember, "id" | "role" | "isActive" | "isBookable">
  >(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}`,
    input,
    accessToken,
  );
}

export function getBusinessMemberAppointmentImpact(
  barbershopId: string,
  memberId: string,
  accessToken: string,
) {
  return apiGet<MemberAppointmentImpact>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/appointment-impact`,
    undefined,
    accessToken,
    { fresh: true },
  );
}

export function updateBusinessMemberBookable(
  barbershopId: string,
  memberId: string,
  isBookable: boolean,
  accessToken: string,
  acknowledgeExistingAppointments = false,
) {
  return apiPut<Pick<BusinessMember, "id" | "isActive" | "isBookable">>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/bookable`,
    { isBookable, acknowledgeExistingAppointments },
    accessToken,
  );
}

export function requestBusinessOwnershipTransfer(
  barbershopId: string,
  memberId: string,
  accessToken: string,
) {
  return apiPost<{
    ownershipTransferVerificationRequired: boolean;
    devOwnershipTransferCode?: string;
  }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/ownership-transfer-request`,
    {},
    accessToken,
  );
}

export function confirmBusinessOwnershipTransfer(
  barbershopId: string,
  memberId: string,
  code: string,
  accessToken: string,
) {
  return apiPost<{ message: string }>(
    `/barbershops/${encodeURIComponent(barbershopId)}/members/${encodeURIComponent(memberId)}/transfer-ownership`,
    { code },
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
