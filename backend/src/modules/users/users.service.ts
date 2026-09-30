import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../../common/email/email.service';
import { PrismaService } from '../../database/prisma.service';
import { normalizeTurkishPhone } from '../../common/phone/normalize-turkish-phone';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ProfileImageService } from './profile-image.service';

const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  birthDate: true,
  provinceCode: true,
  province: true,
  district: true,
  neighborhood: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      isActive: true,
      isBookable: true,
      barbershop: {
        select: {
          id: true,
          isDiscoverable: true,
          name: true,
          slug: true,
          profileImageUrl: true,
          timezone: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

function presentPublicUser(user: PublicUserRecord) {
  const { memberships, ...profile } = user;
  return { ...profile, businessMemberships: memberships };
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profileImageService: ProfileImageService,
    private readonly emailService: EmailService,
  ) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    return presentPublicUser(user);
  }

  async exportMyData(userId: string) {
    const [
      user,
      appointments,
      favorites,
      haircutRecords,
      notificationPreference,
    ] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          birthDate: true,
          createdAt: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          profileImageUrl: true,
          updatedAt: true,
        },
      }),
      this.prisma.appointment.findMany({
        where: { customerId: userId },
        orderBy: { startsAt: 'desc' },
        select: {
          cancelledAt: true,
          cancellationReason: true,
          completedAt: true,
          createdAt: true,
          durationMinutes: true,
          endsAt: true,
          priceSnapshot: true,
          serviceNameSnapshot: true,
          startsAt: true,
          status: true,
          updatedAt: true,
          barbershop: { select: { address: true, name: true, slug: true } },
          businessMember: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.favoriteBarbershop.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          barbershop: { select: { address: true, name: true, slug: true } },
        },
      }),
      this.prisma.haircutRecord.findMany({
        where: { appointment: { customerId: userId } },
        orderBy: { createdAt: 'desc' },
        select: {
          createdAt: true,
          notes: true,
          styleName: true,
          updatedAt: true,
          appointment: { select: { startsAt: true } },
          photos: {
            select: { createdAt: true, mimeType: true, sizeBytes: true },
          },
        },
      }),
      this.prisma.notificationPreference.findUnique({ where: { userId } }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      formatVersion: 1,
      profile: user,
      appointments,
      favoriteBarbershops: favorites,
      haircutHistory: haircutRecords,
      notificationPreferences: notificationPreference
        ? {
            appointmentRemindersEnabled:
              notificationPreference.appointmentRemindersEnabled,
            campaignsEnabled: notificationPreference.campaignsEnabled,
            recommendationsEnabled:
              notificationPreference.recommendationsEnabled,
          }
        : null,
    };
  }

  async requestAccountDeletion(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        email: true,
        memberships: {
          where: { role: 'OWNER', isActive: true },
          select: { barbershop: { select: { name: true } } },
        },
      },
    });
    if (user.memberships.length)
      return {
        ownerBusinesses: user.memberships.map((item) => item.barbershop.name),
        requiresOwnershipResolution: true,
      };
    const code = randomInt(100000, 1000000).toString();
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.accountDeletionChallenge.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.accountDeletionChallenge.create({
        data: {
          userId,
          codeHash: this.deletionCodeHash(userId, code),
          expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        },
      }),
    ]);
    await this.emailService.sendAccountDeletionCode(user.email, code);
    return {
      ...(this.emailService.usesDevelopmentPreview
        ? { devDeletionCode: code }
        : {}),
      deletionVerificationRequired: true,
    };
  }

  async confirmAccountDeletion(userId: string, code: string) {
    const challenge = await this.prisma.accountDeletionChallenge.findFirst({
      where: { userId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (
      !challenge ||
      challenge.expiresAt <= new Date() ||
      challenge.attempts >= 5
    )
      throw new BadRequestException(
        'Hesap silme kodu geçersiz veya süresi dolmuş.',
      );
    const expected = Buffer.from(challenge.codeHash, 'hex');
    const received = Buffer.from(this.deletionCodeHash(userId, code), 'hex');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      await this.prisma.accountDeletionChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Hesap silme kodu hatalı.');
    }
    const ownerCount = await this.prisma.businessMember.count({
      where: { userId, role: 'OWNER', isActive: true },
    });
    if (ownerCount)
      throw new BadRequestException(
        'İşletme sahipliği devredilmeden hesap silinemez.',
      );
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await transaction.accountDeletionChallenge.update({
        where: { id: challenge.id },
        data: { usedAt: now },
      });
      await transaction.appointment.updateMany({
        where: {
          customerId: userId,
          status: 'CONFIRMED',
          startsAt: { gt: now },
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancellationReason: 'Müşteri hesabını sildi.',
        },
      });
      await transaction.haircutRecord.deleteMany({
        where: { appointment: { customerId: userId } },
      });
      await transaction.favoriteBarbershop.deleteMany({ where: { userId } });
      await transaction.appNotification.deleteMany({ where: { userId } });
      await transaction.notificationPreference.deleteMany({
        where: { userId },
      });
      await transaction.pushDevice.deleteMany({ where: { userId } });
      await transaction.businessMember.updateMany({
        where: { userId },
        data: { isActive: false, isBookable: false },
      });
      await transaction.user.update({
        where: { id: userId },
        data: {
          authVersion: { increment: 1 },
          birthDate: null,
          deletedAt: now,
          email: `deleted-${userId}@trimly.invalid`,
          firstName: 'Silinen',
          lastName: 'Müşteri',
          passwordHash: await bcrypt.hash(`${userId}-${now.toISOString()}`, 12),
          phone: null,
          profileImageUrl: null,
        },
      });
    });
    return { message: 'Hesabın silindi.' };
  }

  private deletionCodeHash(userId: string, code: string) {
    const secret =
      process.env.EMAIL_VERIFICATION_SECRET ?? process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET must be configured.');
    return createHmac('sha256', secret)
      .update(`account-deletion:${userId}:${code}`)
      .digest('hex');
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && {
            firstName: dto.firstName?.trim(),
          }),
          ...(dto.lastName !== undefined && {
            lastName: dto.lastName?.trim(),
          }),
          ...(dto.phone !== undefined && {
            phone: dto.phone.trim() ? normalizeTurkishPhone(dto.phone) : null,
          }),
          ...(dto.birthDate !== undefined && {
            birthDate: dto.birthDate ? parseBirthDate(dto.birthDate) : null,
          }),
          ...(dto.provinceCode !== undefined && {
            provinceCode: dto.provinceCode?.trim() || null,
          }),
          ...(dto.province !== undefined && {
            province: dto.province?.trim() || null,
          }),
          ...(dto.district !== undefined && {
            district: dto.district?.trim() || null,
          }),
          ...(dto.neighborhood !== undefined && {
            neighborhood: dto.neighborhood?.trim() || null,
          }),
        },
        select: publicUserSelect,
      });

      return presentPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Bu telefon numarası başka bir kullanıcıda kayıtlı.',
        );
      }

      throw error;
    }
  }

  async updateProfilePhoto(
    userId: string,
    fileName: string,
    publicBaseUrl: string,
  ) {
    const profileImageUrl = new URL(
      `/users/profile-images/${fileName}`,
      publicBaseUrl,
    ).toString();
    const previous = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true },
    });

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { profileImageUrl },
        select: publicUserSelect,
      });
      await this.profileImageService.deleteByUrl(previous?.profileImageUrl);
      return presentPublicUser(user);
    } catch (error) {
      await this.profileImageService.deleteByUrl(profileImageUrl);
      throw error;
    }
  }

  async removeProfilePhoto(userId: string) {
    const previous = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileImageUrl: true },
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl: null },
      select: publicUserSelect,
    });
    await this.profileImageService.deleteByUrl(previous?.profileImageUrl);
    return presentPublicUser(user);
  }
}

function parseBirthDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  const today = new Date();
  const todayKey = [
    today.getUTCFullYear(),
    String(today.getUTCMonth() + 1).padStart(2, '0'),
    String(today.getUTCDate()).padStart(2, '0'),
  ].join('-');

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value ||
    value > todayKey
  ) {
    throw new BadRequestException('Geçerli bir doğum tarihi girmelisin.');
  }

  return date;
}
