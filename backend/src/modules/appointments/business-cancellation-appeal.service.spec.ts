import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  BusinessCancellationAppealStatus,
  BusinessCancellationExemptionReason,
  BusinessReliabilityActionType,
} from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { BusinessReliabilityService } from './business-reliability.service';

describe('business cancellation appeals', () => {
  const memberFindUnique = jest.fn();
  const eventFindUnique = jest.fn();
  const eventFindMany = jest.fn();
  const eventUpdateMany = jest.fn();
  const actionFindMany = jest.fn();
  const actionUpdateMany = jest.fn();
  const notifyDecision = jest.fn();
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    businessMember: { findUnique: memberFindUnique },
    businessCancellationEvent: {
      findUnique: eventFindUnique,
      findMany: eventFindMany,
      updateMany: eventUpdateMany,
    },
    businessReliabilityAction: {
      findMany: actionFindMany,
      updateMany: actionUpdateMany,
    },
  };
  const prisma = {
    ...tx,
    barbershop: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'Europe/Istanbul' }),
    },
    appointment: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
  const notifications = {
    notifyBusinessCancellationAppealDecision: notifyDecision,
  } as unknown as NotificationsService;
  const service = new BusinessReliabilityService(prisma, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
    memberFindUnique.mockResolvedValue({ isActive: true, role: 'OWNER' });
    eventFindUnique.mockResolvedValue({
      id: 'event-1',
      barbershopId: 'shop-1',
      businessMemberId: 'member-1',
      cancelledByUserId: 'barber-1',
      appealRequestedByUserId: 'owner-1',
      appealStatus: BusinessCancellationAppealStatus.PENDING,
    });
    eventUpdateMany.mockResolvedValue({ count: 1 });
    eventFindMany.mockResolvedValue([
      { businessMemberId: 'member-1', points: 2 },
    ]);
    actionFindMany.mockResolvedValue([
      {
        id: 'action-1',
        type: BusinessReliabilityActionType.WARNING,
        businessMemberId: null,
        thresholdPoints: 3,
      },
    ]);
    actionUpdateMany.mockResolvedValue({ count: 1 });
  });

  it('allows only an active owner or manager to appeal once', async () => {
    await service.requestAppeal(
      'shop-1',
      'event-1',
      'owner-1',
      'Platform kesintisi yaşandı',
    );
    expect(eventUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        barbershopId: 'shop-1',
        points: { gt: 0 },
        appealStatus: BusinessCancellationAppealStatus.NOT_REQUESTED,
      },
      data: expect.objectContaining({
        appealStatus: BusinessCancellationAppealStatus.PENDING,
        appealRequestedByUserId: 'owner-1',
      }) as object,
    });
    eventUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      service.requestAppeal(
        'shop-1',
        'event-1',
        'owner-1',
        'Platform kesintisi yaşandı',
      ),
    ).rejects.toThrow(BadRequestException);
    memberFindUnique.mockResolvedValueOnce({ isActive: true, role: 'BARBER' });
    await expect(
      service.requestAppeal(
        'shop-1',
        'event-1',
        'barber-1',
        'Platform kesintisi yaşandı',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('does not let someone linked to the shop review its appeal', async () => {
    memberFindUnique.mockResolvedValueOnce({ id: 'reviewer-member' });
    await expect(
      service.reviewAppeal(
        'event-1',
        'reviewer-1',
        true,
        'Kesinti loglarda doğrulandı',
        BusinessCancellationExemptionReason.PLATFORM_OUTAGE,
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(eventUpdateMany).not.toHaveBeenCalled();
  });

  it('removes an unsupported active sanction after an approved exemption', async () => {
    memberFindUnique.mockResolvedValueOnce(null);
    await service.reviewAppeal(
      'event-1',
      'moderator-1',
      true,
      'Kesinti loglarda doğrulandı',
      BusinessCancellationExemptionReason.PLATFORM_OUTAGE,
    );
    expect(eventUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'event-1',
        appealStatus: BusinessCancellationAppealStatus.PENDING,
      },
      data: expect.objectContaining({
        appealStatus: BusinessCancellationAppealStatus.APPROVED,
        appealReviewedByUserId: 'moderator-1',
        exemptionReason: BusinessCancellationExemptionReason.PLATFORM_OUTAGE,
      }) as object,
    });
    expect(actionUpdateMany).toHaveBeenCalledWith({
      where: { id: 'action-1', resolvedAt: null },
      data: { resolvedAt: expect.any(Date) as Date },
    });
    expect(notifyDecision).toHaveBeenCalledWith('event-1', true);
  });

  it('keeps sanctions when the appeal is rejected', async () => {
    memberFindUnique.mockResolvedValueOnce(null);
    await service.reviewAppeal(
      'event-1',
      'moderator-1',
      false,
      'Kayıtlarda hata bulunamadı',
    );
    expect(actionFindMany).not.toHaveBeenCalled();
    expect(actionUpdateMany).not.toHaveBeenCalled();
    expect(notifyDecision).toHaveBeenCalledWith('event-1', false);
  });

  it('excludes approved events from the effective 90-day score', async () => {
    eventFindMany
      .mockResolvedValueOnce([
        { points: 2, appealStatus: BusinessCancellationAppealStatus.APPROVED },
        { points: 1, appealStatus: BusinessCancellationAppealStatus.REJECTED },
      ])
      .mockResolvedValueOnce([]);
    actionFindMany.mockResolvedValueOnce([]);

    const status = await service.getStatus('shop-1');

    expect(status.points90Days).toBe(1);
    expect(status.cancellationCount90Days).toBe(2);
  });
});
