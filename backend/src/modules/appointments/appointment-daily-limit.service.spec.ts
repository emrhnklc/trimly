import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../../database/prisma.service';
import type { AvailabilityService } from '../availability/availability.service';
import type { NotificationsService } from '../notifications/notifications.service';
import { AppointmentsService } from './appointments.service';
import type { NoShowService } from './no-show.service';
import type { BusinessReliabilityService } from './business-reliability.service';

describe('AppointmentsService daily attendee limit', () => {
  const appointmentCount = jest.fn();
  const appointmentCreate = jest.fn();
  const dependentFindFirst = jest.fn();
  const userFindUnique = jest.fn();
  const memberFindFirst = jest.fn();
  const transaction = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    businessReliabilityAction: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    appointment: { count: appointmentCount, create: appointmentCreate },
    dependentProfile: { findFirst: dependentFindFirst },
    user: { findUnique: userFindUnique },
    businessMember: { findFirst: memberFindFirst },
  };
  const runTransaction = jest.fn(
    (callback: (client: typeof transaction) => Promise<unknown>) =>
      callback(transaction),
  );
  const prisma = {
    $transaction: runTransaction,
    barbershop: {
      findUnique: jest.fn().mockResolvedValue({ timezone: 'Europe/Istanbul' }),
    },
    service: {
      findFirst: jest.fn().mockResolvedValue({
        durationMinutes: 45,
        id: 'service-1',
        name: 'Saç Kesimi',
        price: new Prisma.Decimal(600),
      }),
    },
  } as unknown as PrismaService;
  const availability = {
    findAvailableSlots: jest.fn().mockResolvedValue({
      slots: [
        {
          startsAt: '2099-01-02T09:00:00.000Z',
          endsAt: '2099-01-02T09:45:00.000Z',
        },
      ],
    }),
  } as unknown as AvailabilityService;
  const notifications = {
    notifyNewAppointment: jest.fn(),
  } as unknown as NotificationsService;
  const noShow = { assertCanBook: jest.fn() } as unknown as NoShowService;
  const reliability = {} as BusinessReliabilityService;
  const service = new AppointmentsService(
    prisma,
    availability,
    notifications,
    noShow,
    reliability,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    memberFindFirst.mockResolvedValue({
      isActive: true,
      isBookable: true,
      role: 'BARBER',
    });
    userFindUnique.mockResolvedValue({
      firstName: 'Emir',
      id: 'customer-1',
      lastName: 'Kaya',
    });
    dependentFindFirst.mockResolvedValue({
      firstName: 'Ali',
      id: 'dependent-1',
      lastName: 'Kaya',
    });
  });

  it('rechecks a closed employee inside the booking transaction even when availability was loaded earlier', async () => {
    memberFindFirst.mockResolvedValue({
      isActive: true,
      isBookable: false,
      role: 'BARBER',
    });
    await expect(
      service.create('business-1', 'customer-1', {
        memberId: 'member-1',
        serviceId: 'service-1',
        startsAt: '2099-01-02T09:00:00.000Z',
      }),
    ).rejects.toThrow('Seçilen çalışan artık yeni randevu kabul etmiyor.');
    expect(appointmentCreate).not.toHaveBeenCalled();
    expect(memberFindFirst).toHaveBeenCalledWith({
      where: { id: 'member-1', barbershopId: 'business-1' },
      select: { isActive: true, isBookable: true, role: true },
    });
  });

  it('blocks a second non-cancelled appointment for the account holder on the same local date', async () => {
    appointmentCount.mockResolvedValue(1);

    await expect(
      service.create('business-1', 'customer-1', {
        memberId: 'member-1',
        serviceId: 'service-1',
        startsAt: '2099-01-02T09:00:00.000Z',
      }),
    ).rejects.toThrow(
      new ConflictException(
        'Emir için bu tarihte zaten bir randevu bulunuyor.',
      ),
    );

    expect(appointmentCreate).not.toHaveBeenCalled();
    expect(appointmentCount).toHaveBeenCalledWith({
      where: {
        appointmentLocalDate: new Date('2099-01-02T00:00:00.000Z'),
        customerId: 'customer-1',
        dependentProfileId: null,
        status: { not: 'CANCELLED' },
      },
    });
  });

  it('creates an appointment under the selected dependent identity', async () => {
    appointmentCount.mockResolvedValue(0);
    appointmentCreate.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'appointment-1', ...data }),
    );

    await expect(
      service.create('business-1', 'customer-1', {
        dependentProfileId: 'dependent-1',
        memberId: 'member-1',
        serviceId: 'service-1',
        startsAt: '2099-01-02T09:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      attendeeNameSnapshot: 'Ali Kaya',
      dependentProfileId: 'dependent-1',
    });

    expect(appointmentCount).toHaveBeenCalledWith({
      where: {
        appointmentLocalDate: new Date('2099-01-02T00:00:00.000Z'),
        dependentProfileId: 'dependent-1',
        status: { not: 'CANCELLED' },
      },
    });
  });
});
