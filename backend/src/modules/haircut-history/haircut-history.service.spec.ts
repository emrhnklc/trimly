import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { HaircutHistoryService } from './haircut-history.service';

describe('guardian private photo consent', () => {
  const findFirst = jest.fn();
  const update = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    appointment: { findFirst, update },
    $transaction: transaction,
  } as unknown as PrismaService;
  const service = new HaircutHistoryService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('does not let another account grant a minor photo consent', async () => {
    findFirst.mockResolvedValue(null);
    await expect(
      service.setGuardianPrivatePhotoConsent(
        'appointment-1',
        'other-user',
        true,
      ),
    ).rejects.toThrow(NotFoundException);
    expect(update).not.toHaveBeenCalled();
  });

  it('starts minor consent disabled and records the account holder grant', async () => {
    findFirst.mockResolvedValue({
      id: 'appointment-1',
      status: 'CONFIRMED',
      appointmentLocalDate: new Date('2026-10-06T00:00:00.000Z'),
      dependentProfile: { birthDate: new Date('2018-10-06T00:00:00.000Z') },
      haircutRecord: null,
    });
    update.mockResolvedValue({
      guardianPrivatePhotoConsentAt: new Date('2026-10-06T12:00:00.000Z'),
    });

    await expect(
      service.setGuardianPrivatePhotoConsent('appointment-1', 'owner-1', true),
    ).resolves.toEqual({
      guardianPrivatePhotoConsentAt: new Date('2026-10-06T12:00:00.000Z'),
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { guardianPrivatePhotoConsentAt: expect.any(Date) as Date },
      }),
    );
  });

  it('does not create a child consent for a cancelled booking', async () => {
    findFirst.mockResolvedValue({
      id: 'appointment-1',
      status: 'CANCELLED',
      appointmentLocalDate: new Date('2026-10-06T00:00:00.000Z'),
      dependentProfile: { birthDate: new Date('2018-10-06T00:00:00.000Z') },
      haircutRecord: null,
    });

    await expect(
      service.setGuardianPrivatePhotoConsent('appointment-1', 'owner-1', true),
    ).rejects.toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('withdraws consent and removes the associated photo records', async () => {
    findFirst.mockResolvedValue({
      id: 'appointment-1',
      status: 'COMPLETED',
      appointmentLocalDate: new Date('2026-10-06T00:00:00.000Z'),
      dependentProfile: { birthDate: new Date('2018-10-06T00:00:00.000Z') },
      haircutRecord: { id: 'record-1' },
    });
    const findPhotos = jest.fn().mockResolvedValue([]);
    const deletePhotos = jest.fn().mockResolvedValue({ count: 0 });
    const updateAppointment = jest.fn().mockResolvedValue({});
    transaction.mockImplementation((callback: (tx: unknown) => unknown) =>
      callback({
        appointment: { update: updateAppointment },
        haircutPhoto: { findMany: findPhotos, deleteMany: deletePhotos },
      }),
    );

    await expect(
      service.setGuardianPrivatePhotoConsent('appointment-1', 'owner-1', false),
    ).resolves.toEqual({
      guardianPrivatePhotoConsentAt: null,
      deletedPhotoCount: 0,
    });
    expect(updateAppointment).toHaveBeenCalledWith({
      where: { id: 'appointment-1' },
      data: { guardianPrivatePhotoConsentAt: null },
    });
    expect(deletePhotos).toHaveBeenCalledWith({
      where: { haircutRecordId: 'record-1' },
    });
  });

  it('blocks business access to a child photo without account-holder consent', async () => {
    findFirst.mockResolvedValue({
      id: 'appointment-1',
      status: 'COMPLETED',
      completedAt: new Date(),
      appointmentLocalDate: new Date('2026-10-06T00:00:00.000Z'),
      guardianPrivatePhotoConsentAt: null,
      dependentProfile: { birthDate: new Date('2018-10-06T00:00:00.000Z') },
      businessMember: { userId: 'barber-1' },
    });
    const membershipLookup = jest.fn().mockResolvedValue({
      id: 'member-1',
      isActive: true,
      role: 'BARBER',
    });
    Object.assign(prisma, { businessMember: { findUnique: membershipLookup } });

    await expect(
      service.getPhotoForBusiness(
        'shop-1',
        'appointment-1',
        'photo-1',
        'barber-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
