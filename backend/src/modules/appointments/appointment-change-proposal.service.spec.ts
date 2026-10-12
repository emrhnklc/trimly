import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import type { AvailabilityService } from '../availability/availability.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { AppointmentsService } from './appointments.service';
import type { NoShowService } from './no-show.service';
import type { BusinessReliabilityService } from './business-reliability.service';

describe('AppointmentsService change proposals', () => {
  const appointmentFindFirst = jest.fn();
  const appointmentFindUnique = jest.fn();
  const appointmentCount = jest.fn();
  const appointmentUpdate = jest.fn();
  const membershipFindUnique = jest.fn();
  const serviceFindFirst = jest.fn();
  const proposalFindFirst = jest.fn();
  const proposalUpdateMany = jest.fn();
  const proposalCreate = jest.fn();
  const findAvailableSlots = jest.fn();
  const notifyAppointmentChangeProposal = jest.fn();
  const targetMemberFindFirst = jest.fn();
  const transaction = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    businessMember: { findFirst: targetMemberFindFirst },
    appointment: { count: appointmentCount, update: appointmentUpdate },
    appointmentChangeProposal: { updateMany: proposalUpdateMany },
  };

  const prisma = {
    $transaction: (callback: (tx: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
    appointment: {
      count: appointmentCount,
      findFirst: appointmentFindFirst,
      findUnique: appointmentFindUnique,
      update: appointmentUpdate,
    },
    appointmentChangeProposal: {
      create: proposalCreate,
      findFirst: proposalFindFirst,
      updateMany: proposalUpdateMany,
    },
    businessMember: { findUnique: membershipFindUnique },
    service: { findFirst: serviceFindFirst },
  } as unknown as PrismaService;
  const availability = {
    findAvailableSlots,
  } as unknown as AvailabilityService;
  const notifications = {
    notifyAppointmentChangeProposal,
  } as unknown as NotificationsService;
  const noShow = { assertCanBook: jest.fn() } as unknown as NoShowService;
  const cancelAppointment = jest.fn(() => {
    throw new Error('İptal nedeni en az 3 karakter olmalıdır.');
  });
  const cancelAfterRejectedChangeProposal = jest.fn().mockResolvedValue({
    id: 'appointment-1',
    status: 'CANCELLED',
  });
  const reliability = {
    cancelAppointment,
    cancelAfterRejectedChangeProposal,
  } as unknown as BusinessReliabilityService;
  const service = new AppointmentsService(
    prisma,
    availability,
    notifications,
    noShow,
    reliability,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    appointmentCount.mockResolvedValue(0);
    targetMemberFindFirst.mockResolvedValue({
      isActive: true,
      isBookable: true,
      role: 'BARBER',
    });
  });

  it('requires a meaningful explanation for a business change proposal', async () => {
    await expect(
      service.rescheduleForBusiness('business-1', 'appointment-1', 'user-1', {
        startsAt: '2099-09-26T11:00:00.000Z',
        reason: '   ',
      }),
    ).rejects.toThrow('Değişiklik açıklaması en az 3 karakter olmalıdır.');

    expect(appointmentFindFirst).not.toHaveBeenCalled();
  });

  it('requires a meaningful explanation for a business cancellation', async () => {
    await expect(
      service.cancelForBusiness('business-1', 'appointment-1', 'user-1', {
        reason: '  ',
      }),
    ).rejects.toThrow('İptal nedeni en az 3 karakter olmalıdır.');

    expect(cancelAppointment).toHaveBeenCalledWith(
      'business-1',
      'appointment-1',
      'user-1',
      '  ',
    );
  });

  it('keeps the appointment unchanged and creates a customer proposal', async () => {
    const proposedStartsAt = '2099-09-26T11:00:00.000Z';
    const proposedEndsAt = '2099-09-26T11:45:00.000Z';
    appointmentFindFirst.mockResolvedValue({
      id: 'appointment-1',
      status: 'CONFIRMED',
      serviceId: 'service-old',
      serviceNameSnapshot: 'Eski hizmet',
      priceSnapshot: '400',
      startsAt: new Date('2099-09-27T10:00:00.000Z'),
      businessMemberId: 'member-old',
      businessMember: { userId: 'user-1' },
      barbershop: { timezone: 'Europe/Istanbul' },
    });
    membershipFindUnique.mockResolvedValue({
      id: 'creator-member',
      isActive: true,
      role: 'OWNER',
    });
    serviceFindFirst.mockResolvedValue({
      id: 'service-new',
      name: 'Yeni hizmet',
      durationMinutes: 45,
      price: '650',
    });
    findAvailableSlots.mockResolvedValue({
      slots: [{ startsAt: proposedStartsAt, endsAt: proposedEndsAt }],
    });
    proposalUpdateMany.mockResolvedValue({ count: 0 });
    proposalCreate.mockImplementation(({ data }: { data: object }) =>
      Promise.resolve({ id: 'proposal-1', ...data }),
    );

    await expect(
      service.rescheduleForBusiness('business-1', 'appointment-1', 'user-1', {
        startsAt: proposedStartsAt,
        memberId: 'member-new',
        serviceId: 'service-new',
        reason: 'Çalışan programı değişti.',
      }),
    ).resolves.toMatchObject({
      id: 'proposal-1',
      proposedBusinessMemberId: 'member-new',
      proposedServiceId: 'service-new',
      proposedServiceName: 'Yeni hizmet',
      proposedPrice: '650',
      reason: 'Çalışan programı değişti.',
    });

    expect(proposalCreate).toHaveBeenCalledTimes(1);
    expect(notifyAppointmentChangeProposal).toHaveBeenCalledWith('proposal-1');
  });

  it('does not offer a date already used by the same attendee', async () => {
    appointmentFindFirst.mockResolvedValue({
      attendeeNameSnapshot: 'Ali Kaya',
      businessMemberId: 'member-old',
      customerId: 'customer-1',
      dependentProfileId: 'dependent-1',
      id: 'appointment-1',
      priceSnapshot: '400',
      serviceId: 'service-old',
      serviceNameSnapshot: 'Eski hizmet',
      startsAt: new Date('2099-09-27T10:00:00.000Z'),
      status: 'CONFIRMED',
      businessMember: { userId: 'user-1' },
      barbershop: { timezone: 'Europe/Istanbul' },
    });
    appointmentCount.mockResolvedValue(1);

    await expect(
      service.rescheduleForBusiness('business-1', 'appointment-1', 'user-1', {
        startsAt: '2099-09-26T11:00:00.000Z',
        reason: 'Çalışan programı değişti.',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'Ali Kaya için bu tarihte zaten bir randevu bulunuyor.',
      ),
    );

    expect(findAvailableSlots).not.toHaveBeenCalled();
    expect(proposalCreate).not.toHaveBeenCalled();
  });

  it('rejects a proposal without changing the appointment', async () => {
    proposalFindFirst.mockResolvedValue({
      id: 'proposal-1',
      expiresAt: new Date('2099-09-26T10:00:00.000Z'),
      appointment: {
        businessMemberId: 'member-1',
        customerId: 'customer-1',
        serviceId: 'service-1',
        status: 'CONFIRMED',
        barbershop: { id: 'business-1', timezone: 'Europe/Istanbul' },
      },
    });
    proposalUpdateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.respondToChangeProposal(
        'appointment-1',
        'customer-1',
        'REJECTED',
      ),
    ).resolves.toEqual({ success: true, status: 'REJECTED' });

    expect(appointmentUpdate).not.toHaveBeenCalled();
  });

  it('allows penalty-free cancellation after the latest proposal was rejected', async () => {
    appointmentFindUnique.mockResolvedValue({
      id: 'appointment-1',
      customerId: 'customer-1',
      status: 'CONFIRMED',
      startsAt: new Date('2026-09-25T13:00:00.000Z'),
      changeProposals: [{ status: 'REJECTED' }],
      barbershop: {
        bookingSettings: {
          customerCancellationEnabled: false,
          cancellationNoticeMinutes: 120,
        },
      },
    });
    await expect(
      service.cancelForCustomer('appointment-1', 'customer-1'),
    ).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(cancelAfterRejectedChangeProposal).toHaveBeenCalledWith(
      'appointment-1',
      'customer-1',
    );
    expect(appointmentUpdate).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'only transfers after customer acceptance and a still-bookable target (bookable=%s)',
    async (isBookable) => {
      const startsAt = new Date('2099-09-26T11:00:00.000Z');
      proposalFindFirst.mockResolvedValue({
        id: 'proposal-1',
        expiresAt: new Date('2099-09-26T10:00:00.000Z'),
        proposedStartsAt: startsAt,
        proposedEndsAt: new Date('2099-09-26T11:30:00.000Z'),
        proposedBusinessMemberId: 'member-new',
        proposedServiceId: 'service-1',
        proposedServiceName: 'Saç Kesimi',
        proposedDurationMinutes: 30,
        proposedPrice: '450',
        appointment: {
          customerId: 'customer-1',
          serviceId: 'service-1',
          status: 'CONFIRMED',
          barbershop: { id: 'business-1', timezone: 'Europe/Istanbul' },
        },
      });
      findAvailableSlots.mockResolvedValue({
        slots: [{ startsAt: startsAt.toISOString() }],
      });
      targetMemberFindFirst.mockResolvedValue({
        isActive: true,
        isBookable,
        role: 'BARBER',
      });
      proposalUpdateMany.mockResolvedValue({ count: 1 });
      const response = service.respondToChangeProposal(
        'appointment-1',
        'customer-1',
        'ACCEPTED',
      );
      if (isBookable) {
        await expect(response).resolves.toEqual({
          success: true,
          status: 'ACCEPTED',
        });
        expect(appointmentUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              businessMemberId: 'member-new',
            }) as object,
          }),
        );
      } else {
        await expect(response).rejects.toThrow(
          'Seçilen çalışan artık yeni randevu kabul etmiyor.',
        );
        expect(appointmentUpdate).not.toHaveBeenCalled();
        expect(proposalUpdateMany).not.toHaveBeenCalled();
      }
      expect(targetMemberFindFirst).toHaveBeenCalledWith({
        where: { id: 'member-new', barbershopId: 'business-1' },
        select: { isActive: true, isBookable: true, role: true },
      });
      expect(transaction.$executeRaw).toHaveBeenCalled();
    },
  );
});
