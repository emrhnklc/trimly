import type { ExecutionContext } from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import type { Reflector } from '@nestjs/core';
import type { PrismaService } from '../../database/prisma.service';
import { BusinessRolesGuard } from './business-roles.guard';

describe('BusinessRolesGuard', () => {
  const findUnique = jest.fn();
  const getAllAndOverride = jest.fn();
  const reflector = { getAllAndOverride } as unknown as Reflector;
  const prisma = {
    businessMember: { findUnique },
  } as unknown as PrismaService;
  const guard = new BusinessRolesGuard(reflector, prisma);
  const handler = jest.fn();
  const context = {
    getClass: () => BusinessRolesGuard,
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => ({
        params: { barbershopId: 'barbershop-1' },
        user: { id: 'user-1' },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    getAllAndOverride.mockReturnValue([BusinessRole.OWNER]);
  });

  it('aktif ve izin verilen role sahip üyeyi kabul eder', async () => {
    findUnique.mockResolvedValue({ isActive: true, role: BusinessRole.OWNER });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('pasif üyeyi rolü doğru olsa bile reddeder', async () => {
    findUnique.mockResolvedValue({ isActive: false, role: BusinessRole.OWNER });

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('izin verilmeyen rolü reddeder', async () => {
    findUnique.mockResolvedValue({
      isActive: true,
      role: BusinessRole.MANAGER,
    });

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });
});
