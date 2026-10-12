import { BadRequestException } from '@nestjs/common';
import {
  BusinessCancellationPointReason,
  BusinessReliabilityActionType,
} from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import type { NotificationsService } from '../notifications/notifications.service';
import {
  BusinessReliabilityService,
  businessCancellationPoints,
} from './business-reliability.service';

describe('businessCancellationPoints', () => {
  const startsAt = new Date('2026-10-10T12:00:00.000Z');
  const atLead = (minutes: number) =>
    new Date(startsAt.getTime() - minutes * 60_000);

  it.each([
    [24 * 60 + 1, 0],
    [24 * 60, 1],
    [6 * 60, 1],
    [6 * 60 - 1, 2],
    [2 * 60, 2],
    [2 * 60 - 1, 3],
    [0, 3],
    [-1, 3],
  ])('awards %i minutes before start %i points', (lead, expected) => {
    expect(
      businessCancellationPoints(startsAt, atLead(lead), false).points,
    ).toBe(expected);
  });

  it('awards 3 points if the customer already arrived', () => {
    expect(
      businessCancellationPoints(startsAt, atLead(60), true),
    ).toMatchObject({
      pointReason: BusinessCancellationPointReason.CUSTOMER_ARRIVED,
      points: 3,
    });
  });
});

describe('BusinessReliabilityService', () => {
  const appointmentFindFirst = jest.fn();
  const appointmentUpdateMany = jest.fn();
  const appointmentFindUniqueOrThrow = jest.fn();
  const proposalFindFirst = jest.fn();
  const memberFindUnique = jest.fn();
  const eventCreate = jest.fn();
  const eventFindMany = jest.fn();
  const actionCreate = jest.fn();
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    appointment: {
      findFirst: appointmentFindFirst,
      findUniqueOrThrow: appointmentFindUniqueOrThrow,
      updateMany: appointmentUpdateMany,
    },
    appointmentChangeProposal: { findFirst: proposalFindFirst },
    businessMember: { findUnique: memberFindUnique },
    businessCancellationEvent: {
      create: eventCreate,
      findMany: eventFindMany,
    },
    businessReliabilityAction: { create: actionCreate },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  } as unknown as PrismaService;
  const notifyBusinessCancellation = jest.fn();
  const notifyBusinessReliabilityImpact = jest.fn();
  const notifications = {
    notifyBusinessCancellation,
    notifyBusinessReliabilityImpact,
  } as unknown as NotificationsService;
  const service = new BusinessReliabilityService(prisma, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
    appointmentFindFirst.mockResolvedValue({
      id: 'appointment-1',
      status: 'CONFIRMED',
      startsAt: new Date(Date.now() + 60 * 60_000),
      businessMemberId: 'member-1',
      businessMember: { userId: 'barber-1' },
    });
    memberFindUnique.mockResolvedValue({ isActive: true, role: 'OWNER' });
    appointmentUpdateMany.mockResolvedValue({ count: 1 });
    appointmentFindUniqueOrThrow.mockResolvedValue({
      id: 'appointment-1',
      status: 'CANCELLED',
    });
    eventCreate.mockImplementation(({ data }: { data: object }) =>
      Promise.resolve({ id: 'event-1', ...data }),
    );
    eventFindMany.mockResolvedValue([
      { businessMemberId: 'member-1', points: 3 },
    ]);
  });

  it('requires a reason and does not use unverified customer request', async () => {
    await expect(
      service.cancelAppointment('shop-1', 'appointment-1', 'owner-1', '  '),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.cancelAppointment(
        'shop-1',
        'appointment-1',
        'owner-1',
        'Müşteri talebi',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(appointmentUpdateMany).not.toHaveBeenCalled();
  });

  it('atomically cancels, audits points and notifies the customer', async () => {
    await service.cancelAppointment(
      'shop-1',
      'appointment-1',
      'owner-1',
      'Çalışan müsait değil',
    );
    expect(appointmentUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'appointment-1',
        status: { in: ['CONFIRMED', 'ARRIVED'] },
      },
      data: expect.objectContaining({
        status: 'CANCELLED',
        cancellationReason: 'Çalışan müsait değil',
      }) as object,
    });
    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        appointmentId: 'appointment-1',
        cancelledByUserId: 'owner-1',
        businessMemberId: 'member-1',
        pointReason: BusinessCancellationPointReason.LESS_THAN_2_HOURS,
        points: 3,
      }) as object,
    });
    expect(notifyBusinessCancellation).toHaveBeenCalledWith('appointment-1');
    expect(notifyBusinessReliabilityImpact).toHaveBeenCalledWith('event-1', 3);
  });

  it('does not create a penalty event when the appointment was already changed', async () => {
    appointmentUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.cancelAppointment(
        'shop-1',
        'appointment-1',
        'owner-1',
        'İşletme kapalı',
      ),
    ).rejects.toThrow('Randevu bu sırada değişti.');
    expect(eventCreate).not.toHaveBeenCalled();
    expect(notifyBusinessCancellation).not.toHaveBeenCalled();
  });

  it('records a rejected business proposal cancellation as business responsibility', async () => {
    appointmentFindFirst.mockResolvedValue({
      id: 'appointment-1',
      barbershopId: 'shop-1',
      businessMemberId: 'member-1',
      startsAt: new Date(Date.now() + 60 * 60_000),
      status: 'CONFIRMED',
    });
    proposalFindFirst.mockResolvedValue({
      status: 'REJECTED',
      createdByMember: { userId: 'manager-1' },
    });

    await service.cancelAfterRejectedChangeProposal(
      'appointment-1',
      'customer-1',
    );

    expect(eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cancelledByUserId: 'manager-1',
        reason: 'Müşteri işletmenin değişiklik teklifini reddetti.',
        points: 3,
      }) as object,
    });
    expect(notifyBusinessCancellation).toHaveBeenCalledWith('appointment-1');
  });

  it('starts the 72-hour new-booking hold on the 8-point threshold', async () => {
    eventFindMany.mockResolvedValue([
      { businessMemberId: 'member-2', points: 3 },
      { businessMemberId: 'member-3', points: 3 },
      { businessMemberId: 'member-1', points: 3 },
    ]);
    await service.cancelAppointment(
      'shop-1',
      'appointment-1',
      'owner-1',
      'İşletme kapalı',
    );
    expect(actionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: BusinessReliabilityActionType.BOOKING_SUSPENSION,
      }) as object,
    });
  });

  it('holds the member whose own score reaches five', async () => {
    eventFindMany.mockResolvedValue([
      { businessMemberId: 'member-1', points: 3 },
      { businessMemberId: 'member-1', points: 3 },
    ]);
    await service.cancelAppointment(
      'shop-1',
      'appointment-1',
      'owner-1',
      'İşletme kapalı',
    );
    expect(actionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: BusinessReliabilityActionType.MEMBER_REVIEW_HOLD,
        businessMemberId: 'member-1',
      }) as object,
    });
  });

  it('demotes discovery when five points are spread across members', async () => {
    eventFindMany.mockResolvedValue([
      { businessMemberId: 'member-2', points: 3 },
      { businessMemberId: 'member-1', points: 3 },
    ]);
    await service.cancelAppointment(
      'shop-1',
      'appointment-1',
      'owner-1',
      'İşletme kapalı',
    );
    expect(actionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: BusinessReliabilityActionType.DISCOVERY_DEMOTION,
      }) as object,
    });
  });
});
