import type { PrismaService } from '../../database/prisma.service';
import type { BarbershopReadinessService } from './barbershop-readiness.service';
import { BarbershopsService } from './barbershops.service';

describe('public team summaries', () => {
  function setup(memberIds = ['first', 'second']) {
    const shop = {
      id: 'shop',
      timezone: 'Europe/Istanbul',
      profileImageUrl: null,
      galleryPhotos: [],
      workingHours: [],
      previousWorkingHours: null,
      workingHoursEffectiveFrom: null,
      members: memberIds.map((id) => ({
        id,
        role: 'BARBER',
        user: { firstName: id, lastName: 'Test', profileImageUrl: null },
        serviceAssignments: [{ service: { name: 'Saç Kesimi' } }],
      })),
    };
    const prisma = {
      barbershop: { findUnique: jest.fn().mockResolvedValue(shop) },
      appointmentReview: { groupBy: jest.fn().mockResolvedValue([]) },
      appointment: {
        groupBy: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(42),
      },
    };
    const readiness = {
      getReadiness: jest.fn().mockResolvedValue({ isBookingOpen: true }),
    };
    const service = new BarbershopsService(
      prisma as unknown as PrismaService,
      readiness as unknown as BarbershopReadinessService,
    );
    return { prisma, service };
  }

  it('uses customer-weighted ratings and completed counts independently for each member', async () => {
    const { prisma, service } = setup();
    prisma.appointmentReview.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          businessMemberId: 'first',
          customerId: 'a',
          _avg: { rating: 5 },
          _count: { _all: 5 },
        },
        {
          businessMemberId: 'first',
          customerId: 'b',
          _avg: { rating: 3 },
          _count: { _all: 1 },
        },
        {
          businessMemberId: 'second',
          customerId: 'a',
          _avg: { rating: 2 },
          _count: { _all: 1 },
        },
      ]);
    prisma.appointment.groupBy.mockResolvedValueOnce([
      { businessMemberId: 'first', _count: { _all: 12 } },
      { businessMemberId: 'second', _count: { _all: 3 } },
    ]);
    const result = await service.findPublicBySlug('shop');
    expect(result.completedCount).toBe(42);
    expect(prisma.appointment.count).toHaveBeenCalledWith({
      where: { barbershopId: 'shop', status: 'COMPLETED' },
    });
    expect(result.members[0]).toMatchObject({
      ratingAverage: 4,
      ratingCount: 6,
      completedCount: 12,
      serviceNames: ['Saç Kesimi'],
    });
    expect(result.members[1]).toMatchObject({
      ratingAverage: 2,
      ratingCount: 1,
      completedCount: 3,
    });
    expect(result.members[0]).not.toHaveProperty('serviceAssignments');
    expect(prisma.appointmentReview.groupBy).toHaveBeenNthCalledWith(2, {
      by: ['businessMemberId', 'customerId'],
      where: {
        barbershopId: 'shop',
        businessMemberId: { in: ['first', 'second'] },
        appointment: { status: 'COMPLETED' },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });
    expect(prisma.appointment.groupBy).toHaveBeenCalledWith({
      by: ['businessMemberId'],
      where: {
        barbershopId: 'shop',
        businessMemberId: { in: ['first', 'second'] },
        status: 'COMPLETED',
      },
      _count: { _all: true },
    });
    const calls = prisma.barbershop.findUnique.mock.calls as unknown[][];
    const query = calls[0][0] as {
      select: {
        members: {
          where: unknown;
          select: {
            serviceAssignments: { where: unknown };
            user: { select: unknown };
          };
        };
      };
    };
    const selection = query.select.members;
    expect(selection.where).toMatchObject({ isActive: true, isBookable: true });
    expect(selection.select.serviceAssignments.where).toEqual({
      service: { isActive: true },
    });
    expect(selection.select.user.select).toEqual({
      firstName: true,
      lastName: true,
      profileImageUrl: true,
    });
  });

  it('returns zero counts and no invented score when a member has no history', async () => {
    const { service } = setup();
    const result = await service.findPublicBySlug('shop');
    expect(result.members[0]).toMatchObject({
      ratingAverage: null,
      ratingCount: 0,
      completedCount: 0,
    });
  });

  it('does not run member aggregation queries for an empty team', async () => {
    const { prisma, service } = setup([]);
    expect((await service.findPublicBySlug('shop')).members).toEqual([]);
    expect(prisma.appointmentReview.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.appointment.groupBy).not.toHaveBeenCalled();
  });
});
