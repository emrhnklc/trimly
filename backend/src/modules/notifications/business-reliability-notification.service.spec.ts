import type { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService business reliability notices', () => {
  const eventFindUnique = jest.fn();
  const notificationCreateMany = jest.fn();
  const prisma = {
    businessCancellationEvent: { findUnique: eventFindUnique },
    appNotification: { createMany: notificationCreateMany },
  } as unknown as PrismaService;
  const service = new NotificationsService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    notificationCreateMany.mockResolvedValue({ count: 1 });
  });

  it('notifies other active owners and managers with the exact score impact', async () => {
    eventFindUnique.mockResolvedValue({
      appointmentId: 'appointment-1',
      barbershopId: 'shop-1',
      cancelledByUserId: 'manager-actor',
      points: 3,
      pointReason: 'AFTER_START',
      barbershop: {
        name: 'Trimly Studio',
        members: [
          { user: { id: 'manager-actor', pushDevices: [] } },
          { user: { id: 'owner-1', pushDevices: [] } },
        ],
      },
    });

    await service.notifyBusinessReliabilityImpact('event-1', 5);

    expect(notificationCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'owner-1',
          type: 'BUSINESS_RELIABILITY_POINTS_ADDED',
          title: 'Trimly Studio: +3 güvenilirlik puanı',
          body: expect.stringContaining('Son 90 gündeki aktif puan: 5'),
        }),
      ],
    });
  });

  it('does not create a business notice for a zero-point cancellation', async () => {
    eventFindUnique.mockResolvedValue({ points: 0 });

    await service.notifyBusinessReliabilityImpact('event-1', 0);

    expect(notificationCreateMany).not.toHaveBeenCalled();
  });
});
