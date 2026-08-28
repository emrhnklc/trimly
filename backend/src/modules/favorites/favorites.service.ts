import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: string) {
    const favorites = await this.prisma.favoriteBarbershop.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        barbershop: {
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
          },
        },
      },
    });

    return favorites.map((favorite) => ({
      ...favorite,
      barbershop: {
        ...favorite.barbershop,
        ratingAverage: null,
        ratingCount: 0,
      },
    }));
  }

  async add(userId: string, barbershopId: string) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { id: true },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    return this.prisma.favoriteBarbershop.upsert({
      where: { userId_barbershopId: { userId, barbershopId } },
      create: { userId, barbershopId },
      update: {},
    });
  }

  async remove(userId: string, barbershopId: string) {
    const deleted = await this.prisma.favoriteBarbershop.deleteMany({
      where: { userId, barbershopId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Bu işletme favorilerinde bulunamadı.');
    }

    return { success: true };
  }
}
