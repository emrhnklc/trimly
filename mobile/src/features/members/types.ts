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
};
