import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
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
            latitude: true,
            longitude: true,
            isDiscoverable: true,
            createdAt: true,
            timezone: true,
            accessMode: true,
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
        },
      },
    });

    const ratings = await this.prisma.appointmentReview.groupBy({
      by: ['barbershopId'],
      where: {
        barbershopId: {
          in: favorites.map(({ barbershop }) => barbershop.id),
        },
      },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const ratingsByBarbershop = new Map(
      ratings.map((rating) => [rating.barbershopId, rating]),
    );

    return favorites.map((favorite) => ({
      ...favorite,
      barbershop: {
        ...favorite.barbershop,
        distanceKm: null,
        ratingAverage:
          ratingsByBarbershop.get(favorite.barbershop.id)?._avg.rating ?? null,
        ratingCount:
          ratingsByBarbershop.get(favorite.barbershop.id)?._count._all ?? 0,
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

  async findStyleFavoritesForUser(userId: string) {
    const [galleryFavorites, portfolioFavorites] = await Promise.all([
      this.prisma.favoriteBarbershopPhoto.findMany({
        where: { userId },
        select: {
          createdAt: true,
          photo: {
            select: {
              id: true,
              storageKey: true,
              barbershop: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      this.prisma.favoritePortfolioItem.findMany({
        where: { userId, portfolioItem: { status: 'APPROVED' } },
        select: {
          createdAt: true,
          portfolioItem: {
            select: {
              id: true,
              title: true,
              barbershop: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return [
      ...portfolioFavorites.map(({ createdAt, portfolioItem }) => ({
        createdAt,
        kind: 'PORTFOLIO' as const,
        sourceId: portfolioItem.id,
        title: portfolioItem.title,
        photo: {
          id: portfolioItem.id,
          url: `/portfolio/items/${portfolioItem.id}/image`,
        },
        barbershop: portfolioItem.barbershop,
      })),
      ...galleryFavorites.map(({ createdAt, photo }) => ({
        createdAt,
        kind: 'LEGACY_GALLERY' as const,
        sourceId: photo.id,
        title: null,
        photo: {
          id: photo.id,
          url: `/barbershops/images/${photo.storageKey.split('/').pop()}`,
        },
        barbershop: photo.barbershop,
      })),
    ].sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
    );
  }

  async addStyleFavorite(userId: string, photoId: string) {
    const photo = await this.prisma.barbershopPhoto.findUnique({
      where: { id: photoId },
      select: { id: true },
    });

    if (!photo) throw new NotFoundException('Stil fotoğrafı bulunamadı.');

    return this.prisma.favoriteBarbershopPhoto.upsert({
      where: { userId_photoId: { userId, photoId } },
      create: { userId, photoId },
      update: {},
    });
  }

  async removeStyleFavorite(userId: string, photoId: string) {
    const deleted = await this.prisma.favoriteBarbershopPhoto.deleteMany({
      where: { userId, photoId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Bu stil beğenilerinde bulunamadı.');
    }

    return { success: true };
  }

  async addPortfolioFavorite(userId: string, portfolioItemId: string) {
    const item = await this.prisma.barberPortfolioItem.findFirst({
      where: { id: portfolioItemId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('Yayındaki stil bulunamadı.');

    return this.prisma.favoritePortfolioItem.upsert({
      where: { userId_portfolioItemId: { userId, portfolioItemId } },
      create: { userId, portfolioItemId },
      update: {},
    });
  }

  async removePortfolioFavorite(userId: string, portfolioItemId: string) {
    const deleted = await this.prisma.favoritePortfolioItem.deleteMany({
      where: { userId, portfolioItemId },
    });
    if (!deleted.count) {
      throw new NotFoundException('Bu stil beğenilerinde bulunamadı.');
    }
    return { success: true };
  }
}
