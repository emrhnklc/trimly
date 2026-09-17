import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PortfolioPublicationStatus } from '@prisma/client';
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async requestPublication(
    barbershopId: string,
    appointmentId: string,
    photoId: string,
    userId: string,
    title?: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        businessMemberId: true,
        customerId: true,
        serviceNameSnapshot: true,
        status: true,
        businessMember: { select: { userId: true } },
        haircutRecord: {
          select: {
            styleName: true,
            photos: {
              where: { id: photoId, uploadedBy: 'BUSINESS' },
              select: { id: true },
            },
          },
        },
      },
    });
    if (!appointment || !appointment.haircutRecord?.photos.length) {
      throw new NotFoundException('Tıraş fotoğrafı bulunamadı.');
    }
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Yalnız tamamlanan tıraşlar portföye eklenebilir.',
      );
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { isActive: true, role: true },
    });
    const canRequest =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));
    if (!canRequest)
      throw new ForbiddenException('Yayın izni isteme yetkin yok.');

    const existing = await this.prisma.barberPortfolioItem.findUnique({
      where: { haircutPhotoId: photoId },
      select: { status: true },
    });
    if (existing?.status === PortfolioPublicationStatus.APPROVED) {
      throw new ConflictException('Bu fotoğraf zaten portföyde yayınlanıyor.');
    }
    if (existing?.status === PortfolioPublicationStatus.PENDING) {
      throw new ConflictException('Bu fotoğraf için müşteri onayı bekleniyor.');
    }

    const item = await this.prisma.barberPortfolioItem.upsert({
      where: { haircutPhotoId: photoId },
      create: {
        haircutPhotoId: photoId,
        barbershopId,
        businessMemberId: appointment.businessMemberId,
        customerId: appointment.customerId,
        title:
          title?.trim() ||
          appointment.haircutRecord.styleName ||
          appointment.serviceNameSnapshot,
      },
      update: {
        status: PortfolioPublicationStatus.PENDING,
        title:
          title?.trim() ||
          appointment.haircutRecord.styleName ||
          appointment.serviceNameSnapshot,
        requestedAt: new Date(),
        respondedAt: null,
        revokedAt: null,
      },
      select: portfolioStatusSelect,
    });
    void this.notificationsService.notifyPortfolioConsentRequest(appointmentId);
    return item;
  }

  approve(itemId: string, customerId: string) {
    return this.respond(
      itemId,
      customerId,
      PortfolioPublicationStatus.APPROVED,
    );
  }

  reject(itemId: string, customerId: string) {
    return this.respond(
      itemId,
      customerId,
      PortfolioPublicationStatus.REJECTED,
    );
  }

  async revoke(itemId: string, customerId: string) {
    const updated = await this.prisma.barberPortfolioItem.updateMany({
      where: {
        id: itemId,
        customerId,
        status: PortfolioPublicationStatus.APPROVED,
      },
      data: {
        status: PortfolioPublicationStatus.REVOKED,
        respondedAt: new Date(),
        revokedAt: new Date(),
      },
    });
    if (!updated.count)
      throw new NotFoundException('Yayındaki portföy kaydı bulunamadı.');
    return this.prisma.barberPortfolioItem.findUniqueOrThrow({
      where: { id: itemId },
      select: portfolioStatusSelect,
    });
  }

  async findPublicForBarbershop(barbershopId: string) {
    const items = await this.prisma.barberPortfolioItem.findMany({
      where: { barbershopId, status: PortfolioPublicationStatus.APPROVED },
      orderBy: { respondedAt: 'desc' },
      select: {
        id: true,
        title: true,
        businessMember: {
          select: {
            id: true,
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
    return items.map((item) => ({
      ...item,
      imageUrl: `/portfolio/items/${item.id}/image`,
    }));
  }

  async getPublicImage(itemId: string) {
    const item = await this.prisma.barberPortfolioItem.findFirst({
      where: { id: itemId, status: PortfolioPublicationStatus.APPROVED },
      select: {
        haircutPhoto: { select: { storageKey: true, mimeType: true } },
      },
    });
    if (!item) throw new NotFoundException('Portföy fotoğrafı bulunamadı.');
    try {
      return {
        buffer: await readFile(
          resolve(
            process.cwd(),
            'uploads',
            'haircut-photos',
            basename(item.haircutPhoto.storageKey),
          ),
        ),
        mimeType: item.haircutPhoto.mimeType,
      };
    } catch {
      throw new NotFoundException('Portföy fotoğrafı bulunamadı.');
    }
  }

  private async respond(
    itemId: string,
    customerId: string,
    status:
      | typeof PortfolioPublicationStatus.APPROVED
      | typeof PortfolioPublicationStatus.REJECTED,
  ) {
    const updated = await this.prisma.barberPortfolioItem.updateMany({
      where: {
        id: itemId,
        customerId,
        status: PortfolioPublicationStatus.PENDING,
      },
      data: { status, respondedAt: new Date(), revokedAt: null },
    });
    if (!updated.count)
      throw new NotFoundException('Bekleyen yayın talebi bulunamadı.');
    return this.prisma.barberPortfolioItem.findUniqueOrThrow({
      where: { id: itemId },
      select: portfolioStatusSelect,
    });
  }
}

const portfolioStatusSelect = {
  id: true,
  status: true,
  title: true,
  requestedAt: true,
  respondedAt: true,
  revokedAt: true,
} as const;
