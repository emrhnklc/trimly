import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { MemberProfileService } from './member-profile.service';

describe('MemberProfileService', () => {
  const profile = {
    id: 'member',
    role: 'BARBER',
    isBookable: true,
    user: { firstName: 'Emir', lastName: 'Kaya', profileImageUrl: null },
    serviceAssignments: [],
  };
  let prisma: {
    businessMember: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    appointment: { count: jest.Mock };
    appointmentReview: { groupBy: jest.Mock; findMany: jest.Mock };
  };
  let service: MemberProfileService;
  beforeEach(() => {
    prisma = {
      businessMember: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ id: 'member', role: 'BARBER', isActive: true }),
        findFirst: jest.fn().mockResolvedValue(profile),
        update: jest.fn().mockResolvedValue(profile),
      },
      appointment: { count: jest.fn().mockResolvedValue(3) },
      appointmentReview: {
        groupBy: jest.fn().mockResolvedValue([]),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new MemberProfileService(prisma as unknown as PrismaService);
  });
  it('scopes public statistics and reviews and never selects private account fields', async () => {
    prisma.businessMember.findFirst.mockResolvedValue({
      ...profile,
      reliabilityActions: [{ id: 'hold' }],
    });
    prisma.appointmentReview.groupBy.mockResolvedValue([
      {
        businessMemberId: 'member',
        customerId: 'a',
        _avg: { rating: 5 },
        _count: { _all: 5 },
      },
      {
        businessMemberId: 'member',
        customerId: 'b',
        _avg: { rating: 3 },
        _count: { _all: 1 },
      },
    ]);
    prisma.appointmentReview.findMany.mockResolvedValue([
      {
        id: 'review',
        rating: 5,
        comment: 'İyi',
        createdAt: new Date(),
        customer: { firstName: 'Can' },
      },
    ]);
    const result = await service.findPublic('shop', 'member');
    expect(result.ratingAverage).toBe(4);
    expect(result.ratingCount).toBe(6);
    expect(result.isBookable).toBe(false);
    expect(result).not.toHaveProperty('reliabilityActions');
    expect(result.reviews[0]).not.toHaveProperty('customer');
    const memberQueries = prisma.businessMember.findFirst.mock.calls as [
      { select: { user: { select: Record<string, boolean> } } },
    ][];
    const select = memberQueries[0][0].select;
    expect(Object.keys(select.user.select).sort()).toEqual([
      'firstName',
      'lastName',
      'profileImageUrl',
    ]);
    expect(prisma.appointment.count).toHaveBeenCalledWith({
      where: {
        barbershopId: 'shop',
        businessMemberId: 'member',
        status: 'COMPLETED',
      },
    });
    expect(prisma.appointmentReview.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          barbershopId: 'shop',
          businessMemberId: 'member',
          appointment: { status: 'COMPLETED' },
        },
      }),
    );
  });
  it('does not expose a missing, inactive or foreign member', async () => {
    prisma.businessMember.findFirst.mockResolvedValue(null);
    await expect(service.findPublic('shop', 'foreign')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.appointment.count).not.toHaveBeenCalled();
  });
});
