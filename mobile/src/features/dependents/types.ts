export type DependentRelationship = 'CHILD' | 'SIBLING' | 'DEPENDENT';

export type DependentProfile = {
  id: string;
  firstName: string;
  lastName: string;
  relationship: DependentRelationship;
  birthDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DependentProfileInput = {
  firstName: string;
  lastName: string;
  relationship: DependentRelationship;
  birthDate: string;
  notes?: string;
};

export const dependentRelationshipLabels: Record<DependentRelationship, string> = {
  CHILD: 'Çocuğum',
  SIBLING: 'Kardeşim',
  DEPENDENT: 'Bakmakla yükümlü olduğum kişi',
};

export function getDependentAge(birthDate: string) {
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getUTCFullYear();
  const beforeBirthday =
    today.getMonth() < date.getUTCMonth() ||
    (today.getMonth() === date.getUTCMonth() && today.getDate() < date.getUTCDate());
  if (beforeBirthday) age -= 1;
  return Math.max(age, 0);
}
