import type { PrismaService } from '../../database/prisma.service';
import type { BarbershopReadinessService } from './barbershop-readiness.service';
import { BarbershopsService } from './barbershops.service';

describe('public business profile hours', () => {
  it('uses the current schedule until a planned change takes effect without leaking internal scheduling metadata', async () => {
    const previous = [
      { weekday: 'MONDAY', startTime: '09:00', endTime: '19:00' },
    ];
    const planned = [
      { weekday: 'MONDAY', startTime: '10:00', endTime: '18:00' },
    ];
    const shop = {
      id: 'shop',
      timezone: 'Europe/Istanbul',
      profileImageUrl: null,
      galleryPhotos: [],
      members: [],
      workingHours: planned,
      previousWorkingHours: previous,
      workingHoursEffectiveFrom: new Date(Date.now() + 86400000),
    };
    const prisma = {
      barbershop: { findUnique: jest.fn().mockResolvedValue(shop) },
      appointmentReview: { groupBy: jest.fn().mockResolvedValue([]) },
      appointment: { count: jest.fn().mockResolvedValue(0) },
    };
    const readiness = {
      getReadiness: jest.fn().mockResolvedValue({ isBookingOpen: false }),
    };
    const service = new BarbershopsService(
      prisma as unknown as PrismaService,
      readiness as unknown as BarbershopReadinessService,
    );
    const result = await service.findPublicBySlug('shop');
    expect(result.workingHours).toEqual(previous);
    expect(result.isBookingOpen).toBe(false);
    expect(result).not.toHaveProperty('previousWorkingHours');
    expect(result).not.toHaveProperty('workingHoursEffectiveFrom');
    shop.workingHoursEffectiveFrom = new Date(Date.now() - 86400000);
    expect((await service.findPublicBySlug('shop')).workingHours).toEqual(
      planned,
    );
  });
});
