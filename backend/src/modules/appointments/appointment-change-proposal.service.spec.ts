import type { PrismaService } from '../../database/prisma.service';
import type { AvailabilityService } from '../availability/availability.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService change proposals', () => {
  const appointmentFindFirst = jest.fn();
  const appointmentFindUnique = jest.fn();
  const appointmentUpdate = jest.fn();
  const membershipFindUnique = jest.fn();
  const serviceFindFirst = jest.fn();
  const proposalFindFirst = jest.fn();
  const proposalUpdateMany = jest.fn();
  const proposalCreate = jest.fn();
  const findAvailableSlots = jest.fn();
  const notifyAppointmentChangeProposal = jest.fn();

  const prisma = {
    appointment: {
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
  const service = new AppointmentsService(prisma, availability, notifications);

  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(appointmentFindFirst).not.toHaveBeenCalled();
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
    appointmentUpdate.mockResolvedValue({
      id: 'appointment-1',
      status: 'CANCELLED',
    });

    await expect(
      service.cancelForCustomer('appointment-1', 'customer-1'),
    ).resolves.toMatchObject({ status: 'CANCELLED' });
  });
});
