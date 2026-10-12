export type BusinessMemberRole = "OWNER" | "MANAGER" | "BARBER" | "APPRENTICE";

export type BusinessMember = {
  id: string;
  role: BusinessMemberRole;
  isActive: boolean;
  isBookable: boolean;
  outstandingAppointmentCount?: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
  };
  serviceAssignments: {
    service: {
      id: string;
      name: string;
      durationMinutes: number;
      isActive: boolean;
    };
  }[];
};

export type CreateBusinessInvitationInput = {
  role: Exclude<BusinessMemberRole, "OWNER">;
  expiresInHours?: number;
};

export type BusinessInvitation = {
  id: string;
  role: Exclude<BusinessMemberRole, "OWNER">;
  expiresAt: string;
  createdAt: string;
  token: string;
};

export type BusinessInvitationStatus =
  "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";

export type BusinessInvitationSummary = Omit<BusinessInvitation, "token"> & {
  acceptedBy: string | null;
  status: BusinessInvitationStatus;
};

export type BusinessInvitationPreview = {
  id: string;
  role: Exclude<BusinessMemberRole, "OWNER">;
  expiresAt: string;
  status: BusinessInvitationStatus;
  barbershop: { id: string; name: string; slug: string };
};

export type CustomerBarbershopAccess = {
  grantedAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
};

export type UpdateBusinessMemberInput = {
  role?: Exclude<BusinessMemberRole, "OWNER">;
  isActive?: boolean;
};

export type MemberAppointmentImpact = {
  total: number;
  appointments: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: "CONFIRMED" | "ARRIVED";
    attendeeNameSnapshot: string;
    serviceNameSnapshot: string;
    changeProposals: { id: string }[];
  }[];
};
