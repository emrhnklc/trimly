import type { BusinessRole } from '@/features/auth/types';

export const businessRoleLabels: Record<BusinessRole, string> = {
  OWNER: 'İşletme Sahibi',
  MANAGER: 'Yönetici',
  BARBER: 'Berber',
  APPRENTICE: 'Çırak',
};
