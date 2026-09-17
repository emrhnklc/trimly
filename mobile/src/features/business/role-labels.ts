import type { BusinessRole } from '@/features/auth/types';

export const businessRoleLabels: Record<BusinessRole, string> = {
  OWNER: 'İşletme Sahibi',
  MANAGER: 'Yönetici',
  BARBER: 'Berber',
  APPRENTICE: 'Çırak',
};

export const businessRoleEnglishLabels: Record<BusinessRole, string> = {
  OWNER: 'Business Owner',
  MANAGER: 'Manager',
  BARBER: 'Barber',
  APPRENTICE: 'Apprentice',
};
