import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { EmailService } from '../../common/email/email.service';
import { PrismaService } from '../../database/prisma.service';
import { summarizeCustomerRatingsByKey } from '../reviews/customer-weighted-rating';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateBusinessMemberDto } from './dto/update-business-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async requestOwnershipTransfer(
    barbershopId: string,
    targetMemberId: string,
    currentOwnerId: string,
  ) {
    const [owner, target] = await Promise.all([
      this.prisma.businessMember.findUnique({
        where: {
          userId_barbershopId: { userId: currentOwnerId, barbershopId },
        },
        select: {
          id: true,
          isActive: true,
          role: true,
          user: { select: { email: true } },
          barbershop: { select: { name: true } },
        },
      }),
      this.prisma.businessMember.findFirst({
        where: { id: targetMemberId, barbershopId },
        select: { id: true, isActive: true, role: true, userId: true },
      }),
    ]);
    if (!owner?.isActive || owner.role !== 'OWNER') {
      throw new BadRequestException(
        'Sahiplik devrini yalnız mevcut işletme sahibi başlatabilir.',
      );
    }
    if (
      !target ||
      !target.isActive ||
      target.role === 'OWNER' ||
      target.userId === currentOwnerId
    ) {
      throw new BadRequestException(
        'Yeni sahip, bu işletmede aktif bir çalışan olmalıdır.',
      );
    }

    const code = randomInt(100000, 1000000).toString();
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.ownershipTransferChallenge.updateMany({
        where: { currentOwnerId, barbershopId, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.ownershipTransferChallenge.create({
        data: {
          currentOwnerId,
          barbershopId,
          targetMemberId,
          codeHash: this.ownershipTransferCodeHash(
            currentOwnerId,
            targetMemberId,
            code,
          ),
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        },
      }),
    ]);
    await this.emailService.sendOwnershipTransferCode(
      owner.user.email,
      code,
      owner.barbershop.name,
    );
    return {
      ownershipTransferVerificationRequired: true,
      ...(this.emailService.usesDevelopmentPreview
        ? { devOwnershipTransferCode: code }
        : {}),
    };
  }

  async confirmOwnershipTransfer(
    barbershopId: string,
    targetMemberId: string,
    currentOwnerId: string,
    code: string,
  ) {
    const challenge = await this.prisma.ownershipTransferChallenge.findFirst({
      where: { currentOwnerId, barbershopId, targetMemberId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (
      !challenge ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= 5
    ) {
      throw new BadRequestException(
        'Sahiplik devri kodu geçersiz veya süresi dolmuş.',
      );
    }
    const expected = Buffer.from(challenge.codeHash, 'hex');
    const received = Buffer.from(
      this.ownershipTransferCodeHash(currentOwnerId, targetMemberId, code),
      'hex',
    );
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      await this.prisma.ownershipTransferChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Sahiplik devri kodu hatalı.');
    }

    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const [owner, target] = await Promise.all([
        transaction.businessMember.findUnique({
          where: {
            userId_barbershopId: { userId: currentOwnerId, barbershopId },
          },
          select: { id: true, isActive: true, role: true },
        }),
        transaction.businessMember.findFirst({
          where: { id: targetMemberId, barbershopId },
          select: { id: true, isActive: true, role: true, userId: true },
        }),
      ]);
      if (
        !owner?.isActive ||
        owner.role !== 'OWNER' ||
        !target?.isActive ||
        target.role === 'OWNER' ||
        target.userId === currentOwnerId
      ) {
        throw new BadRequestException(
          'İşletme üyelikleri değiştiği için sahiplik devri yapılamadı.',
        );
      }
      await transaction.ownershipTransferChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: now },
      });
      await transaction.businessMember.update({
        where: { id: target.id },
        data: { role: 'OWNER' },
      });
      await transaction.businessMember.update({
        where: { id: owner.id },
        data: { role: 'MANAGER' },
      });
    });
    return { message: 'İşletme sahipliği devredildi.' };
  }

  async createInvitation(
    barbershopId: string,
    createdByUserId: string,
    dto: CreateInvitationDto,
  ) {
    if (dto.role === 'OWNER') {
      throw new BadRequestException(
        'Owner rolü davet bağlantısıyla verilemez.',
      );
    }

    const creatorMembership = await this.prisma.businessMember.findUnique({
      where: {
        userId_barbershopId: {
          userId: createdByUserId,
          barbershopId,
        },
      },
    });

    if (!creatorMembership) {
      throw new NotFoundException('İşletme üyeliği bulunamadı.');
    }

    const token = randomBytes(32).toString('base64url');
    const expiresInHours = dto.expiresInHours ?? 24;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    const invitation = await this.prisma.businessInvitation.create({
      data: {
        barbershopId,
        createdByMemberId: creatorMembership.id,
        tokenHash: this.hashToken(token),
        role: dto.role,
        expiresAt,
      },
      select: {
        id: true,
        role: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...invitation,
      token,
    };
  }

  async previewInvitation(token: string) {
    const invitation = await this.prisma.businessInvitation.findUnique({
      where: { tokenHash: this.hashToken(token) },
      select: {
        id: true,
        role: true,
        expiresAt: true,
        usedAt: true,
        revokedAt: true,
        barbershop: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invitation) throw new NotFoundException('Davet bulunamadı.');

    return {
      id: invitation.id,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      status: this.invitationStatus(invitation),
      barbershop: invitation.barbershop,
    };
  }

  async findInvitations(barbershopId: string) {
    const invitations = await this.prisma.businessInvitation.findMany({
      where: { barbershopId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        role: true,
        expiresAt: true,
        createdAt: true,
        usedAt: true,
        revokedAt: true,
        acceptedByUser: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      status: this.invitationStatus(invitation),
      acceptedBy: invitation.acceptedByUser
        ? `${invitation.acceptedByUser.firstName} ${invitation.acceptedByUser.lastName}`
        : null,
    }));
  }

  async revokeInvitation(barbershopId: string, invitationId: string) {
    const invitation = await this.prisma.businessInvitation.findFirst({
      where: { id: invitationId, barbershopId },
      select: { id: true, usedAt: true, revokedAt: true },
    });
    if (!invitation) throw new NotFoundException('Davet bulunamadı.');
    if (invitation.usedAt) {
      throw new BadRequestException('Kullanılmış bir davet iptal edilemez.');
    }
    if (invitation.revokedAt) return { revoked: true };

    await this.prisma.businessInvitation.update({
      where: { id: invitation.id },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }

  async acceptInvitation(token: string, userId: string) {
    const tokenHash = this.hashToken(token);

    return this.prisma.$transaction(async (transaction) => {
      const invitation = await transaction.businessInvitation.findUnique({
        where: { tokenHash },
      });

      if (!invitation) {
        throw new NotFoundException('Davet bulunamadı.');
      }

      if (invitation.revokedAt || invitation.usedAt) {
        throw new BadRequestException('Bu davet artık kullanılamaz.');
      }

      if (invitation.role === 'OWNER') {
        throw new BadRequestException(
          'Owner rolü davet bağlantısıyla verilemez.',
        );
      }

      if (invitation.expiresAt <= new Date()) {
        throw new BadRequestException('Bu davetin süresi dolmuş.');
      }

      const existingMembership = await transaction.businessMember.findUnique({
        where: {
          userId_barbershopId: {
            userId,
            barbershopId: invitation.barbershopId,
          },
        },
      });

      if (existingMembership) {
        throw new ConflictException('Bu işletmenin zaten üyesisin.');
      }

      const now = new Date();
      const consumedInvitation =
        await transaction.businessInvitation.updateMany({
          where: {
            id: invitation.id,
            usedAt: null,
            revokedAt: null,
            expiresAt: { gt: now },
          },
          data: {
            usedAt: now,
            acceptedByUserId: userId,
          },
        });

      if (consumedInvitation.count !== 1) {
        throw new ConflictException(
          'Bu davet az önce kullanıldı veya geçersiz oldu.',
        );
      }

      return transaction.businessMember.create({
        data: {
          userId,
          barbershopId: invitation.barbershopId,
          role: invitation.role,
        },
        select: {
          id: true,
          role: true,
          isBookable: true,
          barbershop: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });
    });
  }

  private invitationStatus(invitation: {
    expiresAt: Date;
    revokedAt: Date | null;
    usedAt: Date | null;
  }) {
    if (invitation.revokedAt) return 'REVOKED' as const;
    if (invitation.usedAt) return 'USED' as const;
    if (invitation.expiresAt <= new Date()) return 'EXPIRED' as const;
    return 'ACTIVE' as const;
  }

  findByBarbershop(barbershopId: string) {
    return this.prisma.businessMember.findMany({
      where: { barbershopId },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        role: true,
        isActive: true,
        isBookable: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        serviceAssignments: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
                isActive: true,
              },
            },
          },
        },
      },
    });
  }

  async findOneByBarbershop(barbershopId: string, memberId: string) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: {
        id: true,
        role: true,
        isActive: true,
        isBookable: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImageUrl: true,
          },
        },
        serviceAssignments: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Çalışan bu işletmeye ait değil.');
    }

    return member;
  }

  async findPublicBarbers(barbershopId: string) {
    const members = await this.prisma.businessMember.findMany({
      where: { barbershopId, isActive: true, isBookable: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        serviceAssignments: {
          where: { service: { isActive: true } },
          select: {
            service: {
              select: { id: true, name: true, durationMinutes: true },
            },
          },
        },
      },
    });
    const ratingGroups = await this.prisma.appointmentReview.groupBy({
      by: ['businessMemberId', 'customerId'],
      where: { businessMemberId: { in: members.map(({ id }) => id) } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const ratingsByMember = summarizeCustomerRatingsByKey(
      ratingGroups,
      'businessMemberId',
    );

    return members.map((member) => ({
      ...member,
      ratingAverage: ratingsByMember.get(member.id)?.ratingAverage ?? null,
      ratingCount: ratingsByMember.get(member.id)?.ratingCount ?? 0,
      ratingCustomerCount:
        ratingsByMember.get(member.id)?.ratingCustomerCount ?? 0,
    }));
  }

  async updateBookable(
    barbershopId: string,
    memberId: string,
    isBookable: boolean,
  ) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: { id: true, isActive: true, role: true },
    });

    if (!member) {
      throw new NotFoundException('Çalışan bu işletmeye ait değil.');
    }

    if (isBookable && !member.isActive) {
      throw new BadRequestException(
        'Pasif bir çalışan randevu alınabilir yapılamaz.',
      );
    }

    if (isBookable && member.role === 'APPRENTICE') {
      throw new BadRequestException(
        'Çırak rolündeki çalışan randevuya açılamaz.',
      );
    }

    return this.prisma.businessMember.update({
      where: { id: member.id },
      data: { isBookable },
      select: { id: true, isActive: true, isBookable: true },
    });
  }

  async updateMember(
    barbershopId: string,
    memberId: string,
    dto: UpdateBusinessMemberDto,
  ) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: { id: true, role: true },
    });

    if (!member) {
      throw new NotFoundException('Çalışan bu işletmeye ait değil.');
    }

    if (member.role === 'OWNER' || dto.role === 'OWNER') {
      throw new BadRequestException(
        'Owner rolü bu endpoint ile değiştirilemez. Sahiplik devri ayrı bir işlemdir.',
      );
    }

    return this.prisma.businessMember.update({
      where: { id: member.id },
      data: {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isActive === false && { isBookable: false }),
        ...(dto.role === 'APPRENTICE' && { isBookable: false }),
      },
      select: { id: true, role: true, isActive: true, isBookable: true },
    });
  }

  private ownershipTransferCodeHash(
    currentOwnerId: string,
    targetMemberId: string,
    code: string,
  ) {
    const secret =
      process.env.EMAIL_VERIFICATION_SECRET ?? process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET must be configured.');
    return createHmac('sha256', secret)
      .update(`ownership-transfer:${currentOwnerId}:${targetMemberId}:${code}`)
      .digest('hex');
  }

  async assignService(
    barbershopId: string,
    memberId: string,
    serviceId: string,
  ) {
    const [member, service] = await Promise.all([
      this.prisma.businessMember.findFirst({
        where: { id: memberId, barbershopId },
        select: { id: true },
      }),
      this.prisma.service.findFirst({
        where: { id: serviceId, barbershopId },
        select: { id: true },
      }),
    ]);

    if (!member || !service) {
      throw new NotFoundException(
        'Çalışan veya hizmet bu işletmeye ait değil.',
      );
    }

    return this.prisma.businessMemberService.upsert({
      where: {
        businessMemberId_serviceId: { businessMemberId: memberId, serviceId },
      },
      create: { businessMemberId: memberId, serviceId },
      update: {},
    });
  }

  async unassignService(
    barbershopId: string,
    memberId: string,
    serviceId: string,
  ) {
    const assignment = await this.prisma.businessMemberService.findFirst({
      where: {
        businessMemberId: memberId,
        serviceId,
        businessMember: { barbershopId },
        service: { barbershopId },
      },
      select: { businessMemberId: true, serviceId: true },
    });

    if (!assignment) {
      throw new NotFoundException('Bu çalışana ait hizmet ataması bulunamadı.');
    }

    await this.prisma.businessMemberService.delete({
      where: {
        businessMemberId_serviceId: {
          businessMemberId: assignment.businessMemberId,
          serviceId: assignment.serviceId,
        },
      },
    });

    return { success: true };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
}
