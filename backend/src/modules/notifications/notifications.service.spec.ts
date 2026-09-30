import type { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService appointment reminders', () => {
  const findMany = jest.fn();
  const updateMany = jest.fn();
  const createNotification = jest.fn();
  const prisma = {
    appointment: { findMany, updateMany },
    appNotification: { create: createNotification },
  } as unknown as PrismaService;
  const service = new NotificationsService(prisma);

  beforeEach(() => {
    findMany.mockReset();
    updateMany.mockReset();
    createNotification.mockReset();
  });

  it('does not send a two-hour reminder for an appointment created inside the two-hour window', async () => {
    const now = Date.now();
    findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'appointment-1',
          startsAt: new Date(now + 118 * 60 * 1000),
          updatedAt: new Date(now),
          serviceNameSnapshot: 'Saç Kesimi',
          customer: {
            id: 'customer-1',
            firstName: 'Emir',
            notificationPreference: { appointmentRemindersEnabled: true },
            pushDevices: [],
          },
          barbershop: {
            id: 'business-1',
            name: 'Trimly Studio',
            timezone: 'Europe/Istanbul',
          },
        },
      ]);
    updateMany.mockResolvedValue({ count: 1 });

    await service.reconcileAppointmentReminders();

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { reminder2hSentAt: expect.any(Date) },
        where: expect.objectContaining({ id: 'appointment-1' }),
      }),
    );
    expect(createNotification).not.toHaveBeenCalled();
  });
});
