import { SetMetadata } from '@nestjs/common';
import { BusinessRole } from '@prisma/client';

export const BUSINESS_ROLES_KEY = 'businessRoles';
export const Roles = (...roles: BusinessRole[]) =>
  SetMetadata(BUSINESS_ROLES_KEY, roles);
