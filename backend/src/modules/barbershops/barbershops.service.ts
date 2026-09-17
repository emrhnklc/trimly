import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BarbershopAccessMode, BusinessRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { PrismaService } from '../../database/prisma.service';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { RedeemBarbershopAccessDto } from './dto/redeem-barbershop-access.dto';
import { UpdateBarbershopAccessSettingsDto } from './dto/update-barbershop-access-settings.dto';
import { UpdateBarbershopProfileDto } from './dto/update-barbershop-profile.dto';
import { BarbershopSearchQueryDto } from './dto/barbershop-search-query.dto';

const ACCESS_ATTEMPT_LIMIT = 5;
const ACCESS_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const ACCESS_LOCK_DURATION_MS = 15 * 60 * 1000;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const imageFilePattern = /^[0-9a-f-]{36}\.(jpg|png|webp)$/i;

@Injectable()
export class BarbershopsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSlugAvailability(slug: string) {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      return { available: false };
    }
    const existing = await this.prisma.barbershop.findUnique({
      where: { slug: normalizedSlug },
      select: { id: true },
    });
    return { available: !existing };
  }

  async create(ownerId: string, dto: CreateBarbershopDto) {
    this.validateLocationPair(dto.latitude, dto.longitude);
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
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDiscoverable:
          dto.latitude !== undefined && dto.longitude !== undefined,
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

  async createWithPhotos(
    ownerId: string,
    dto: CreateBarbershopDto,
    profilePhoto: Express.Multer.File | undefined,
    galleryPhotos: Express.Multer.File[],
    publicBaseUrl: string,
  ) {
    this.validateLocationPair(dto.latitude, dto.longitude);
    if (!dto.address?.trim()) {
      throw new BadRequestException('İşletme adresi zorunludur.');
    }
    if (!dto.phone || !/^\+90[2-5]\d{9}$/.test(dto.phone.trim())) {
      throw new BadRequestException(
        'İşletme telefonu +90 ile başlayan geçerli bir numara olmalıdır.',
      );
    }
    if (dto.latitude === undefined || dto.longitude === undefined) {
      throw new BadRequestException('İşletme konumu doğrulanmalıdır.');
    }
    if (!profilePhoto) {
      throw new BadRequestException('İşletme profil fotoğrafı zorunludur.');
    }
    if (galleryPhotos.length < 2) {
      throw new BadRequestException(
        'İşletme galerisine en az iki fotoğraf eklemelisin.',
      );
    }

    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.prisma.barbershop.findUnique({
      where: { slug },
    });
    if (existing)
      throw new ConflictException('Bu işletme bağlantısı zaten kullanılıyor.');

    const saved = await Promise.all(
      [profilePhoto, ...galleryPhotos].map((file) => this.saveImage(file)),
    );
    try {
      return await this.prisma.barbershop.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim(),
          profileImageUrl: this.imageUrl(saved[0].fileName, publicBaseUrl),
          coverImageUrl: this.imageUrl(saved[1].fileName, publicBaseUrl),
          phone: dto.phone?.trim(),
          address: dto.address?.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          isDiscoverable:
            dto.latitude !== undefined && dto.longitude !== undefined,
          timezone: dto.timezone?.trim() ?? 'Europe/Istanbul',
          members: { create: { userId: ownerId, role: BusinessRole.OWNER } },
          bookingSettings: { create: {} },
          galleryPhotos: {
            create: saved.slice(1).map((image, sortOrder) => ({
              storageKey: image.storageKey,
              mimeType: image.mimeType,
              sizeBytes: image.sizeBytes,
              sortOrder,
            })),
          },
        },
        include: {
          bookingSettings: true,
          members: true,
          galleryPhotos: { orderBy: { sortOrder: 'asc' } },
        },
      });
    } catch (error) {
      await Promise.all(saved.map((image) => this.deleteImage(image.fileName)));
      throw error;
    }
  }

  async getImage(fileName: string) {
    if (!imageFilePattern.test(fileName))
      throw new NotFoundException('İşletme fotoğrafı bulunamadı.');
    try {
      const extension = fileName.split('.').pop();
      return {
        buffer: await readFile(this.imagePath(fileName)),
        mimeType:
          extension === 'png'
            ? 'image/png'
            : extension === 'webp'
              ? 'image/webp'
              : 'image/jpeg',
      };
    } catch {
      throw new NotFoundException('İşletme fotoğrafı bulunamadı.');
    }
  }

  async updateProfileImage(
    barbershopId: string,
    file: Express.Multer.File | undefined,
    publicBaseUrl: string,
  ) {
    if (!file)
      throw new BadRequestException('Bir profil fotoğrafı gönderilmelidir.');
    const saved = await this.saveImage(file);
    try {
      return await this.prisma.barbershop.update({
        where: { id: barbershopId },
        data: { profileImageUrl: this.imageUrl(saved.fileName, publicBaseUrl) },
      });
    } catch (error) {
      await this.deleteImage(saved.fileName);
      throw error;
    }
  }

  async updateCoverImage(
    barbershopId: string,
    file: Express.Multer.File | undefined,
    publicBaseUrl: string,
  ) {
    if (!file)
      throw new BadRequestException('Bir kapak fotoğrafı gönderilmelidir.');
    const saved = await this.saveImage(file);
    try {
      return await this.prisma.barbershop.update({
        where: { id: barbershopId },
        data: { coverImageUrl: this.imageUrl(saved.fileName, publicBaseUrl) },
      });
    } catch (error) {
      await this.deleteImage(saved.fileName);
      throw error;
    }
  }

  async addGalleryImages(
    barbershopId: string,
    files: Express.Multer.File[],
    publicBaseUrl: string,
  ) {
    if (!files.length)
      throw new BadRequestException(
        'En az bir galeri fotoğrafı gönderilmelidir.',
      );
    const saved = await Promise.all(files.map((file) => this.saveImage(file)));
    try {
      return await this.prisma.$transaction(async (tx) => {
        const current = await tx.barbershopPhoto.aggregate({
          where: { barbershopId },
          _max: { sortOrder: true },
        });
        const shop = await tx.barbershop.update({
          where: { id: barbershopId },
          data: {
            ...(current._max.sortOrder === null
              ? {
                  coverImageUrl: this.imageUrl(
                    saved[0].fileName,
                    publicBaseUrl,
                  ),
                }
              : {}),
            galleryPhotos: {
              create: saved.map((image, index) => ({
                storageKey: image.storageKey,
                mimeType: image.mimeType,
                sizeBytes: image.sizeBytes,
                sortOrder: (current._max.sortOrder ?? -1) + index + 1,
              })),
            },
          },
          select: { id: true, profileImageUrl: true, coverImageUrl: true },
        });
        return shop;
      });
    } catch (error) {
      await Promise.all(saved.map((image) => this.deleteImage(image.fileName)));
      throw error;
    }
  }

  private async saveImage(file: Express.Multer.File) {
    if (
      file.size > MAX_IMAGE_SIZE ||
      !this.imageExtension(file.buffer, file.mimetype)
    ) {
      throw new BadRequestException(
        'Fotoğraflar JPEG, PNG veya WebP ve en fazla 5 MB olmalıdır.',
      );
    }
    const fileName = `${randomUUID()}.${this.imageExtension(file.buffer, file.mimetype)}`;
    await mkdir(resolve(process.cwd(), 'uploads', 'barbershop-photos'), {
      recursive: true,
    });
    await writeFile(this.imagePath(fileName), file.buffer, { flag: 'wx' });
    return {
      fileName,
      storageKey: `barbershop-photos/${fileName}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  private imageExtension(buffer: Buffer, mimeType: string) {
    if (
      mimeType === 'image/jpeg' &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    )
      return 'jpg';
    if (
      mimeType === 'image/png' &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      return 'png';
    if (
      mimeType === 'image/webp' &&
      buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
      buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
    )
      return 'webp';
    return null;
  }

  private imagePath(fileName: string) {
    return resolve(
      process.cwd(),
      'uploads',
      'barbershop-photos',
      basename(fileName),
    );
  }
  private async deleteImage(fileName: string) {
    await unlink(this.imagePath(fileName)).catch(() => undefined);
  }
  private imageUrl(fileName: string, publicBaseUrl: string) {
    return new URL(`/barbershops/images/${fileName}`, publicBaseUrl).toString();
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
        latitude: true,
        longitude: true,
        timezone: true,
        isDiscoverable: true,
        accessMode: true,
        galleryPhotos: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, storageKey: true, sortOrder: true },
        },
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

    const rating = await this.prisma.appointmentReview.aggregate({
      where: { barbershopId: barbershop.id },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      ...barbershop,
      galleryPhotos: barbershop.galleryPhotos.map((photo) => ({
        id: photo.id,
        sortOrder: photo.sortOrder,
        url: new URL(
          `/barbershops/images/${photo.storageKey.split('/').pop()}`,
          barbershop.profileImageUrl ?? 'http://localhost:3000',
        ).toString(),
      })),
      ratingAverage: rating._avg.rating,
      ratingCount: rating._count._all,
    };
  }

  async findPublic(query: BarbershopSearchQueryDto) {
    const term = query.search?.trim();
    const hasLocation =
      query.latitude !== undefined && query.longitude !== undefined;

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
      take: hasLocation ? 100 : 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImageUrl: true,
        coverImageUrl: true,
        address: true,
        latitude: true,
        longitude: true,
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

    const ratings = await this.prisma.appointmentReview.groupBy({
      by: ['barbershopId'],
      where: { barbershopId: { in: barbershops.map(({ id }) => id) } },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const ratingsByBarbershop = new Map(
      ratings.map((rating) => [rating.barbershopId, rating]),
    );

    const results = barbershops.map((barbershop) => {
      const rating = ratingsByBarbershop.get(barbershop.id);
      return {
        ...barbershop,
        ratingAverage: rating?._avg.rating ?? null,
        ratingCount: rating?._count._all ?? 0,
        distanceKm:
          hasLocation &&
          barbershop.latitude !== null &&
          barbershop.longitude !== null
            ? distanceInKilometers(
                query.latitude!,
                query.longitude!,
                barbershop.latitude,
                barbershop.longitude,
              )
            : null,
      };
    });

    return hasLocation
      ? results
          .filter((barbershop) => barbershop.distanceKm !== null)
          .sort(
            (first, second) =>
              (first.distanceKm ?? Infinity) - (second.distanceKm ?? Infinity),
          )
          .slice(0, 20)
      : results;
  }

  async updateProfile(barbershopId: string, dto: UpdateBarbershopProfileDto) {
    try {
      const current = await this.prisma.barbershop.findUnique({
        where: { id: barbershopId },
        select: { latitude: true, longitude: true, isDiscoverable: true },
      });
      if (!current) throw new NotFoundException('İşletme bulunamadı.');

      const latitude =
        dto.latitude !== undefined ? dto.latitude : current.latitude;
      const longitude =
        dto.longitude !== undefined ? dto.longitude : current.longitude;
      this.validateLocationPair(latitude, longitude);

      const isDiscoverable = dto.isDiscoverable ?? current.isDiscoverable;
      if (isDiscoverable && (latitude === null || longitude === null)) {
        throw new BadRequestException(
          'İşletmeyi keşfette yayınlamak için konumunu doğrulamalısın.',
        );
      }

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
          ...(dto.latitude !== undefined && { latitude: dto.latitude }),
          ...(dto.longitude !== undefined && { longitude: dto.longitude }),
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

  private validateLocationPair(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ) {
    const hasLatitude = latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== undefined && longitude !== null;
    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'İşletme konumu için enlem ve boylam birlikte gönderilmelidir.',
      );
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

  async getCustomerAccesses(barbershopId: string) {
    return this.prisma.customerBarbershopAccess.findMany({
      where: { barbershopId, revokedAt: null },
      orderBy: { grantedAt: 'desc' },
      select: {
        grantedAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });
  }

  async revokeCustomerAccess(barbershopId: string, customerId: string) {
    const result = await this.prisma.customerBarbershopAccess.updateMany({
      where: { barbershopId, userId: customerId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (!result.count) {
      throw new NotFoundException('Aktif müşteri erişimi bulunamadı.');
    }
    return { revoked: true };
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

function distanceInKilometers(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(lat2 - lat1);
  const longitudeDelta = radians(lon2 - lon1);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lat1)) *
      Math.cos(radians(lat2)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    Math.round(
      6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)) * 10,
    ) / 10
  );
}
