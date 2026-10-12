import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { summarizeCustomerRatingsByKey } from '../reviews/customer-weighted-rating';

const profileSelection = {
  id: true,
  role: true,
  isBookable: true,
  user: { select: { firstName: true, lastName: true, profileImageUrl: true } },
  serviceAssignments: {
    where: { service: { isActive: true } },
    select: {
      service: {
        select: { id: true, name: true, durationMinutes: true, price: true },
      },
    },
  },
} as const;

@Injectable()
export class MemberProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async findPublic(barbershopId: string, memberId: string) {
    const member = await this.prisma.businessMember.findFirst({
      where: {
        id: memberId,
        barbershopId,
        isActive: true,
        role: { not: 'APPRENTICE' },
      },
      select: {
        ...profileSelection,
        reliabilityActions: {
          where: { type: 'MEMBER_REVIEW_HOLD', resolvedAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!member)
      throw new NotFoundException('Berber profili şu anda görüntülenemiyor.');
    const [groups, completedCount, reviews] = await Promise.all([
      this.prisma.appointmentReview.groupBy({
        by: ['businessMemberId', 'customerId'],
        where: {
          businessMemberId: memberId,
          barbershopId,
          appointment: { status: 'COMPLETED' },
        },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.appointment.count({
        where: {
          barbershopId,
          businessMemberId: memberId,
          status: 'COMPLETED',
        },
      }),
      this.prisma.appointmentReview.findMany({
        where: {
          barbershopId,
          businessMemberId: memberId,
          appointment: { status: 'COMPLETED' },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          customer: { select: { firstName: true } },
        },
      }),
    ]);
    const rating = summarizeCustomerRatingsByKey(
      groups,
      'businessMemberId',
    ).get(memberId);
    const { reliabilityActions, ...profile } = member;
    return {
      ...profile,
      isBookable: member.isBookable && !reliabilityActions.length,
      completedCount,
      ratingAverage: rating?.ratingAverage ?? null,
      ratingCount: rating?.ratingCount ?? 0,
      reviews: reviews.map(({ customer, ...review }) => ({
        ...review,
        customerName: customer.firstName,
      })),
    };
  }
}
