import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingRestrictionScope, NoShowCaseStatus } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { NoShowService } from './no-show.service';

describe('NoShowService', () => {
  const appointmentFindUnique = jest.fn();
  const appointmentUpdateMany = jest.fn();
  const proposalFindFirst = jest.fn();
  const caseCreate = jest.fn();
  const caseFindMany = jest.fn();
  const caseFindUnique = jest.fn();
  const caseUpdateMany = jest.fn();
  const restrictionFindFirst = jest.fn();
  const restrictionCreate = jest.fn();
  const transactionClient = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    appointment: {
      findUnique: appointmentFindUnique,
      updateMany: appointmentUpdateMany,
    },
    appointmentChangeProposal: { findFirst: proposalFindFirst },
    appointmentNoShowCase: {
      create: caseCreate,
      findMany: caseFindMany,
      findUnique: caseFindUnique,
      updateMany: caseUpdateMany,
    },
    bookingRestriction: { create: restrictionCreate },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
        callback(transactionClient),
    ),
    appointmentNoShowCase: {
      findMany: caseFindMany,
      updateMany: caseUpdateMany,
    },
    bookingRestriction: { findFirst: restrictionFindFirst },
  } as unknown as PrismaService;
  const notifyAppointmentNoShow = jest.fn();
  const notifications = {
    notifyAppointmentNoShow,
    notifyNoShowDecision: jest.fn(),
  } as unknown as NotificationsService;
  const service = new NoShowService(prisma, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
    proposalFindFirst.mockResolvedValue(null);
    caseFindMany.mockResolvedValue([]);
  });

  it('does not allow Gelmedi before the fifteen minute wait ends', async () => {
    const now = Date.now();
    appointmentFindUnique.mockResolvedValue({
      id: 'appointment-1',
      status: 'CONFIRMED',
      startsAt: new Date(now - 14 * 60_000),
      endsAt: new Date(now + 30 * 60_000),
    });

    await expect(service.mark('appointment-1', 'staff-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(appointmentUpdateMany).not.toHaveBeenCalled();
    expect(caseCreate).not.toHaveBeenCalled();
  });

  it('creates an auditable pending case and sends the customer a notice', async () => {
    const now = Date.now();
    appointmentFindUnique.mockResolvedValue({
      id: 'appointment-1',
      barbershopId: 'shop-1',
      customerId: 'customer-1',
      dependentProfileId: 'child-1',
      status: 'CONFIRMED',
      startsAt: new Date(now - 16 * 60_000),
      endsAt: new Date(now + 30 * 60_000),
    });
    appointmentUpdateMany.mockResolvedValue({ count: 1 });
    caseCreate.mockResolvedValue({ id: 'case-1' });

    await service.mark('appointment-1', 'staff-1');

    expect(caseCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: 'appointment-1',
        customerId: 'customer-1',
        dependentProfileId: 'child-1',
        markedByUserId: 'staff-1',
      }) as object,
    });
    expect(notifyAppointmentNoShow).toHaveBeenCalledWith('appointment-1');
  });

  it('does not apply a restriction during the dispute window', async () => {
    caseFindMany.mockResolvedValue([]);
    restrictionFindFirst.mockResolvedValue(null);

    await expect(
      service.assertCanBook('customer-1', 'shop-1'),
    ).resolves.toBeUndefined();
  });

  it('blocks booking for an active platform restriction', async () => {
    restrictionFindFirst.mockResolvedValue({
      scope: BookingRestrictionScope.PLATFORM,
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await expect(service.assertCanBook('customer-1', 'shop-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('adds business and platform restrictions on the third confirmed no-show', async () => {
    const now = new Date();
    const record = {
      id: 'case-3',
      appointmentId: 'appointment-3',
      customerId: 'customer-1',
      barbershopId: 'shop-1',
      markedAt: new Date(now.getTime() - 49 * 60 * 60_000),
      disputeDeadline: new Date(now.getTime() - 60_000),
      status: NoShowCaseStatus.PENDING_DISPUTE,
    };
    caseFindMany
      .mockResolvedValueOnce([{ id: 'case-3' }])
      .mockResolvedValueOnce([
        { id: 'case-1', barbershopId: 'shop-1' },
        { id: 'case-2', barbershopId: 'shop-2' },
        { id: 'case-3', barbershopId: 'shop-1' },
      ]);
    caseFindUnique.mockResolvedValue(record);
    caseUpdateMany.mockResolvedValue({ count: 1 });

    await service.reconcileExpiredCases('customer-1');

    expect(restrictionCreate).toHaveBeenCalledTimes(2);
    expect(restrictionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scope: BookingRestrictionScope.BARBERSHOP,
      }) as object,
    });
    expect(restrictionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        scope: BookingRestrictionScope.PLATFORM,
      }) as object,
    });
  });
});
