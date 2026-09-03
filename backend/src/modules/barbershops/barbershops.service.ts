import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BarbershopAccessMode, BusinessRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { RedeemBarbershopAccessDto } from './dto/redeem-barbershop-access.dto';
import { UpdateBarbershopAccessSettingsDto } from './dto/update-barbershop-access-settings.dto';
import { UpdateBarbershopProfileDto } from './dto/update-barbershop-profile.dto';

const ACCESS_ATTEMPT_LIMIT = 5;
const ACCESS_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const ACCESS_LOCK_DURATION_MS = 15 * 60 * 1000;

@Injectable()
export class BarbershopsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBarbershopDto) {
    const slug = dto.slug.trim().toLowerCase();
    const existingBarbershop = await this.prisma.barbershop.findUnique({
      where: { slug },
    });

    if (existingBarbershop) {
      throw new ConflictException('Bu işletme bağlantısı zaten kullanılıyor.');
    }

    return this.prisma.barbershop.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim(),
        profileImageUrl: dto.profileImageUrl?.trim(),
        coverImageUrl: dto.coverImageUrl?.trim(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        timezone: dto.timezone?.trim() ?? 'Europe/Istanbul',
        members: {
          create: {
            userId: ownerId,
            role: BusinessRole.OWNER,
          },
        },
        bookingSettings: {
          create: {},
        },
      },
      include: {
        bookingSettings: true,
        members: true,
      },
    });
  }

  async findPublicBySlug(slug: string) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImageUrl: true,
        coverImageUrl: true,
        phone: true,
        address: true,
        timezone: true,
        isDiscoverable: true,
        accessMode: true,
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
          },
        },
        members: {
          where: {
            isActive: true,
            isBookable: true,
            role: {
              in: [
                BusinessRole.OWNER,
                BusinessRole.MANAGER,
                BusinessRole.BARBER,
              ],
            },
          },
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    return {
      ...barbershop,
      ratingAverage: null,
      ratingCount: 0,
    };
  }

  async findPublic(search?: string) {
    const term = search?.trim();

    const barbershops = await this.prisma.barbershop.findMany({
      where: {
        isDiscoverable: true,
        accessMode: BarbershopAccessMode.PUBLIC,
        ...(term
          ? {
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { description: { contains: term, mode: 'insensitive' } },
                { address: { contains: term, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImageUrl: true,
        coverImageUrl: true,
        address: true,
        isDiscoverable: true,
        accessMode: true,
        createdAt: true,
        members: {
          where: {
            isActive: true,
            isBookable: true,
            role: {
              in: [
                BusinessRole.OWNER,
                BusinessRole.MANAGER,
                BusinessRole.BARBER,
              ],
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 4,
          select: {
            id: true,
            role: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    return barbershops.map((barbershop) => ({
      ...barbershop,
      ratingAverage: null,
      ratingCount: 0,
    }));
  }

  async updateProfile(barbershopId: string, dto: UpdateBarbershopProfileDto) {
    try {
      return await this.prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim() || null,
          }),
          ...(dto.profileImageUrl !== undefined && {
            profileImageUrl: dto.profileImageUrl.trim() || null,
          }),
          ...(dto.coverImageUrl !== undefined && {
            coverImageUrl: dto.coverImageUrl.trim() || null,
          }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() || null }),
          ...(dto.address !== undefined && {
            address: dto.address.trim() || null,
          }),
          ...(dto.isDiscoverable !== undefined && {
            isDiscoverable: dto.isDiscoverable,
          }),
        },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('İşletme bulunamadı.');
      }

      throw error;
    }
  }

  async updateAccessSettings(
    barbershopId: string,
    dto: UpdateBarbershopAccessSettingsDto,
  ) {
    try {
      const barbershop = await this.prisma.barbershop.update({
        where: { id: barbershopId },
        data: { accessMode: dto.accessMode },
        select: {
          id: true,
          accessMode: true,
          isDiscoverable: true,
          accessCode: { select: { updatedAt: true } },
        },
      });

      return this.toAccessSettings(barbershop);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('İşletme bulunamadı.');
      }

      throw error;
    }
  }

  async getAccessSettings(barbershopId: string) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        id: true,
        accessMode: true,
        isDiscoverable: true,
        accessCode: { select: { updatedAt: true } },
      },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    return this.toAccessSettings(barbershop);
  }

  async rotateAccessCode(barbershopId: string) {
    const barbershopExists = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    });

    if (!barbershopExists) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const code = this.generateAccessCode();
    const codeHash = await bcrypt.hash(code, 12);
    const accessCode = await this.prisma.barbershopAccessCode.upsert({
      where: { barbershopId },
      update: { codeHash },
      create: { barbershopId, codeHash },
      select: { updatedAt: true },
    });

    return {
      code,
      updatedAt: accessCode.updatedAt,
    };
  }

  async redeemCustomerAccess(
    userId: string,
    slug: string,
    dto: RedeemBarbershopAccessDto,
  ) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { slug: slug.trim().toLowerCase() },
      select: {
        id: true,
        name: true,
        slug: true,
        accessMode: true,
        accessCode: { select: { codeHash: true } },
      },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    if (barbershop.accessMode === BarbershopAccessMode.PUBLIC) {
      return {
        barbershopId: barbershop.id,
        slug: barbershop.slug,
        accessGranted: true,
        alreadyGranted: true,
      };
    }

    const existingAccess =
      await this.prisma.customerBarbershopAccess.findUnique({
        where: {
          userId_barbershopId: { userId, barbershopId: barbershop.id },
        },
        select: { revokedAt: true },
      });

    if (existingAccess && existingAccess.revokedAt === null) {
      return {
        barbershopId: barbershop.id,
        slug: barbershop.slug,
        accessGranted: true,
        alreadyGranted: true,
      };
    }

    if (!barbershop.accessCode) {
      throw new ConflictException(
        'İşletme henüz bir müşteri erişim kodu oluşturmadı.',
      );
    }

    const now = new Date();
    const attempt =
      await this.prisma.customerBarbershopAccessAttempt.findUnique({
        where: {
          userId_barbershopId: { userId, barbershopId: barbershop.id },
        },
      });

    if (attempt?.lockedUntil && attempt.lockedUntil > now) {
      this.throwAccessAttemptLimit(attempt.lockedUntil);
    }

    const isValidCode = await bcrypt.compare(
      dto.code,
      barbershop.accessCode.codeHash,
    );

    if (!isValidCode) {
      const lockedUntil = await this.recordFailedAccessAttempt(
        userId,
        barbershop.id,
        attempt,
        now,
      );

      if (lockedUntil) {
        this.throwAccessAttemptLimit(lockedUntil);
      }

      throw new ForbiddenException('Erişim kodu hatalı.');
    }

    await this.prisma.$transaction([
      this.prisma.customerBarbershopAccess.upsert({
        where: {
          userId_barbershopId: { userId, barbershopId: barbershop.id },
        },
        update: { grantedAt: now, revokedAt: null },
        create: { userId, barbershopId: barbershop.id, grantedAt: now },
      }),
      this.prisma.customerBarbershopAccessAttempt.deleteMany({
        where: { userId, barbershopId: barbershop.id },
      }),
    ]);

    return {
      barbershopId: barbershop.id,
      slug: barbershop.slug,
      accessGranted: true,
      alreadyGranted: false,
    };
  }

  private toAccessSettings(barbershop: {
    id: string;
    accessMode: BarbershopAccessMode;
    isDiscoverable: boolean;
    accessCode: { updatedAt: Date } | null;
  }) {
    return {
      id: barbershop.id,
      accessMode: barbershop.accessMode,
      isDiscoverable: barbershop.isDiscoverable,
      hasAccessCode: Boolean(barbershop.accessCode),
      accessCodeUpdatedAt: barbershop.accessCode?.updatedAt ?? null,
    };
  }

  private generateAccessCode(length = 8) {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    return Array.from(
      { length },
      () => alphabet[randomInt(0, alphabet.length)],
    ).join('');
  }

  private async recordFailedAccessAttempt(
    userId: string,
    barbershopId: string,
    attempt: {
      failedAttempts: number;
      windowStartedAt: Date;
    } | null,
    now: Date,
  ) {
    const windowExpired =
      !attempt ||
      attempt.windowStartedAt.getTime() <=
        now.getTime() - ACCESS_ATTEMPT_WINDOW_MS;
    const failedAttempts = windowExpired ? 1 : attempt.failedAttempts + 1;
    const windowStartedAt = windowExpired ? now : attempt.windowStartedAt;
    const lockedUntil =
      failedAttempts >= ACCESS_ATTEMPT_LIMIT
        ? new Date(now.getTime() + ACCESS_LOCK_DURATION_MS)
        : null;

    await this.prisma.customerBarbershopAccessAttempt.upsert({
      where: { userId_barbershopId: { userId, barbershopId } },
      update: { failedAttempts, windowStartedAt, lockedUntil },
      create: {
        userId,
        barbershopId,
        failedAttempts,
        windowStartedAt,
        lockedUntil,
      },
    });

    return lockedUntil;
  }

  private throwAccessAttemptLimit(lockedUntil: Date): never {
    throw new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: 'Çok fazla hatalı deneme yapıldı. Daha sonra tekrar dene.',
        lockedUntil,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
