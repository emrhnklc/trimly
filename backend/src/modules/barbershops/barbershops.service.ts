import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateBarbershopDto } from './dto/create-barbershop.dto';
import { UpdateBarbershopProfileDto } from './dto/update-barbershop-profile.dto';

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

    return barbershop;
  }

  findPublic(search?: string) {
    const term = search?.trim();

    return this.prisma.barbershop.findMany({
      where: term
        ? {
            name: {
              contains: term,
              mode: 'insensitive',
            },
          }
        : undefined,
      orderBy: { name: 'asc' },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        profileImageUrl: true,
        address: true,
      },
    });
  }

  async updateProfile(barbershopId: string, dto: UpdateBarbershopProfileDto) {
    try {
      return await this.prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
          ...(dto.name !== undefined && { name: dto.name.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim(),
          }),
          ...(dto.profileImageUrl !== undefined && {
            profileImageUrl: dto.profileImageUrl.trim(),
          }),
          ...(dto.coverImageUrl !== undefined && {
            coverImageUrl: dto.coverImageUrl.trim(),
          }),
          ...(dto.phone !== undefined && { phone: dto.phone.trim() }),
          ...(dto.address !== undefined && { address: dto.address.trim() }),
        },
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        throw new NotFoundException('İşletme bulunamadı.');
      }

      throw error;
    }
  }
}
