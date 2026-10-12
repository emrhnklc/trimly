import type { ExecutionContext } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { BarbershopAccessMode } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import { BarbershopBookingAccessGuard } from './barbershop-booking-access.guard';

describe('BarbershopBookingAccessGuard', () => {
  const findUnique = jest.fn();
  const prisma = {
    barbershop: { findUnique },
  } as unknown as PrismaService;
  const guard = new BarbershopBookingAccessGuard(prisma);
  const context = {
    switchToHttp: () => ({
      getRequest: () => ({
        params: { barbershopId: 'barbershop-1' },
        user: { id: 'user-1' },
      }),
    }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('herkese açık işletmeye giriş izni verir', async () => {
    findUnique.mockResolvedValue({
      accessMode: BarbershopAccessMode.PUBLIC,
      members: [],
      customerAccesses: [],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('kodlu işletmede erişim kazanmış müşteriye izin verir', async () => {
    findUnique.mockResolvedValue({
      accessMode: BarbershopAccessMode.CODE_REQUIRED,
      members: [],
      customerAccesses: [{ userId: 'user-1' }],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('kodlu işletmenin aktif çalışanına izin verir', async () => {
    findUnique.mockResolvedValue({
      accessMode: BarbershopAccessMode.CODE_REQUIRED,
      members: [{ id: 'member-1' }],
      customerAccesses: [],
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('izni olmayan müşteriye açıklayıcı hata verir', async () => {
    findUnique.mockResolvedValue({
      accessMode: BarbershopAccessMode.CODE_REQUIRED,
      members: [],
      customerAccesses: [],
    });

    await expect(guard.canActivate(context)).rejects.toMatchObject({
      response: {
        statusCode: 403,
        code: 'BARBERSHOP_ACCESS_REQUIRED',
      },
    });
  });

  it('olmayan işletme için 404 verir', async () => {
    findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
