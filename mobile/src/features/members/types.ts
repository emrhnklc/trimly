export type BusinessMemberRole = 'OWNER' | 'MANAGER' | 'BARBER' | 'APPRENTICE';

export type BusinessMember = {
  id: string;
  role: BusinessMemberRole;
  isActive: boolean;
  isBookable: boolean;
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
  role: Exclude<BusinessMemberRole, 'OWNER'>;
  expiresInHours?: number;
};

export type BusinessInvitation = {
  id: string;
  role: Exclude<BusinessMemberRole, 'OWNER'>;
  expiresAt: string;
  createdAt: string;
  inviteUrl: string;
};

export type UpdateBusinessMemberInput = {
  role?: Exclude<BusinessMemberRole, 'OWNER'>;
  isActive?: boolean;
};
