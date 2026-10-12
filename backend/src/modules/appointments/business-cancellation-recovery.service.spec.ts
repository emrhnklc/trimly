import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import type { AvailabilityService } from '../availability/availability.service';
import { BusinessCancellationRecoveryService } from './business-cancellation-recovery.service';

describe('BusinessCancellationRecoveryService', () => {
  const appointmentFindFirst = jest.fn();
  const memberFindMany = jest.fn();
  const findAvailableSlots = jest.fn();
  const prisma = {
    appointment: { findFirst: appointmentFindFirst },
    businessMember: { findMany: memberFindMany },
  } as unknown as PrismaService;
  const availability = { findAvailableSlots } as unknown as AvailabilityService;
  const service = new BusinessCancellationRecoveryService(prisma, availability);

  beforeEach(() => {
    jest.clearAllMocks();
    appointmentFindFirst.mockResolvedValue({
      barbershopId: 'shop-1',
      serviceId: 'service-1',
      barbershop: {
        id: 'shop-1',
        name: 'Trimly',
        slug: 'trimly',
        timezone: 'Europe/Istanbul',
        latitude: 38.4,
        longitude: 27.1,
        bookingSettings: { maxBookingAdvanceDays: 14 },
      },
    });
    memberFindMany.mockResolvedValue([
      { id: 'member-1', user: { firstName: 'Emir', lastName: 'Kaya' } },
      { id: 'member-2', user: { firstName: 'Mert', lastName: 'Aydın' } },
    ]);
    findAvailableSlots.mockImplementation(
      (_shopId: string, query: { date: string; memberId: string }) => ({
        date: query.date,
        slots: [
          {
            startTime: query.memberId === 'member-1' ? '10:00' : '09:00',
            startsAt: `${query.date}T${query.memberId === 'member-1' ? '10' : '09'}:00:00.000Z`,
            endsAt: `${query.date}T11:00:00.000Z`,
          },
        ],
      }),
    );
  });

  it('only considers the authenticated customer’s business-cancelled appointment', async () => {
    appointmentFindFirst.mockResolvedValueOnce(null);
    await expect(
      service.getOptions('appointment-1', 'customer-1'),
    ).rejects.toThrow(NotFoundException);
    expect(appointmentFindFirst).toHaveBeenCalledWith({
      where: {
        id: 'appointment-1',
        customerId: 'customer-1',
        status: 'CANCELLED',
        businessCancellation: { isNot: null },
      },
      select: expect.any(Object) as object,
    });
    expect(findAvailableSlots).not.toHaveBeenCalled();
  });

  it('returns chronological options only from active assigned bookable staff', async () => {
    const result = await service.getOptions('appointment-1', 'customer-1');
    expect(memberFindMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        barbershopId: 'shop-1',
        isActive: true,
        isBookable: true,
        serviceAssignments: { some: { serviceId: 'service-1' } },
      }) as object,
      select: expect.any(Object) as object,
    });
    expect(result.options).toHaveLength(4);
    expect(result.options[0].memberName).toBe('Mert Aydın');
    expect(result.options[1].memberName).toBe('Emir Kaya');
    expect(result.bookingOpen).toBe(true);
    expect(result.searchedDays).toBe(7);
  });

  it('returns no same-shop times when the business is closed for bookings', async () => {
    findAvailableSlots.mockRejectedValueOnce(
      new ConflictException({ code: 'BARBERSHOP_BOOKING_CLOSED' }),
    );
    const result = await service.getOptions('appointment-1', 'customer-1');
    expect(result.options).toEqual([]);
    expect(result.bookingOpen).toBe(false);
  });

  it('does not query availability when no employee offers that service', async () => {
    memberFindMany.mockResolvedValueOnce([]);
    const result = await service.getOptions('appointment-1', 'customer-1');
    expect(result.options).toEqual([]);
    expect(result.bookingOpen).toBe(false);
    expect(findAvailableSlots).not.toHaveBeenCalled();
  });

  it('does not mask unrelated availability errors', async () => {
    findAvailableSlots.mockRejectedValueOnce(new Error('database unavailable'));
    await expect(
      service.getOptions('appointment-1', 'customer-1'),
    ).rejects.toThrow('database unavailable');
  });
});
