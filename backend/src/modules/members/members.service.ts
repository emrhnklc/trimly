import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateBusinessMemberDto } from './dto/update-business-member.dto';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvitation(
    barbershopId: string,
    createdByUserId: string,
    dto: CreateInvitationDto,
  ) {
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
      inviteUrl: `trimly.app/join/${token}`,
    };
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
      },
    });
  }

  findPublicBarbers(barbershopId: string) {
    return this.prisma.businessMember.findMany({
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
  }

  async updateBookable(
    barbershopId: string,
    memberId: string,
    isBookable: boolean,
  ) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: { id: true, isActive: true },
    });

    if (!member) {
      throw new NotFoundException('Çalışan bu işletmeye ait değil.');
    }

    if (isBookable && !member.isActive) {
      throw new BadRequestException(
        'Pasif bir çalışan randevu alınabilir yapılamaz.',
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
      },
      select: { id: true, role: true, isActive: true, isBookable: true },
    });
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
