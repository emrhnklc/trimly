import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { PrismaService } from '../../database/prisma.service';
import { UpsertHaircutRecordDto } from './dto/upsert-haircut-record.dto';

@Injectable()
export class HaircutHistoryService {
  private readonly businessPhotoUploadWindowMs = 60 * 1000;
  private readonly uploadsDirectory = resolve(process.cwd(), 'uploads');
  private readonly acceptedMimeTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async upsertForAppointment(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    dto: UpsertHaircutRecordDto,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        businessMember: { select: { userId: true } },
        haircutRecord: { select: { finalizedAt: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Tıraş kaydı yalnız tamamlanmış randevuya eklenebilir.',
      );
    }

    if (appointment.haircutRecord?.finalizedAt) {
      throw new ForbiddenException(
        'Tamamlanan tıraş kaydı işletme tarafından değiştirilemez.',
      );
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true, role: true },
    });
    const canManageRecord =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));

    if (!canManageRecord || !membership) {
      throw new ForbiddenException('Bu tıraş kaydını düzenleme yetkin yok.');
    }

    return this.prisma.haircutRecord.upsert({
      where: { appointmentId: appointment.id },
      create: {
        appointmentId: appointment.id,
        createdByMemberId: membership.id,
        styleName: dto.styleName?.trim(),
        notes: dto.notes?.trim(),
      },
      update: {
        styleName: dto.styleName?.trim(),
        notes: dto.notes?.trim(),
      },
    });
  }

  findForCustomer(customerId: string) {
    return this.prisma.haircutRecord
      .findMany({
        where: {
          appointment: {
            customerId,
          },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          styleName: true,
          notes: true,
          createdAt: true,
          photos: {
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              mimeType: true,
              sizeBytes: true,
              sortOrder: true,
            },
          },
          appointment: {
            select: {
              id: true,
              serviceId: true,
              serviceNameSnapshot: true,
              priceSnapshot: true,
              durationMinutes: true,
              startsAt: true,
              barbershop: {
                select: { id: true, name: true, slug: true },
              },
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
          },
        },
      })
      .then((records) =>
        records.map((record) => ({
          ...record,
          photos: record.photos.map((photo) => ({
            ...photo,
            url: `/haircut-records/${record.id}/photos/${photo.id}`,
          })),
        })),
      );
  }

  async addPhotoForAppointment(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    customerConsentConfirmed: boolean,
    file: Express.Multer.File | undefined,
  ) {
    const { appointment } = await this.assertCanManageRecord(
      barbershopId,
      appointmentId,
      userId,
    );
    if (
      !appointment.completedAt ||
      Date.now() >
        appointment.completedAt.getTime() + this.businessPhotoUploadWindowMs
    ) {
      throw new BadRequestException(
        'Fotoğraf ekleme süresi doldu. Tıraş notlarını güncellemeye devam edebilirsin.',
      );
    }
    const record = await this.prisma.haircutRecord.findUnique({
      where: { appointmentId: appointment.id },
      select: { finalizedAt: true, id: true },
    });

    if (!record) {
      throw new BadRequestException(
        'Fotoğraf eklemeden önce tıraş kaydı oluşturulmalıdır.',
      );
    }

    if (record.finalizedAt) {
      throw new ForbiddenException(
        'Tamamlanan tıraş kaydına işletme tarafından fotoğraf eklenemez.',
      );
    }

    if (!customerConsentConfirmed) {
      throw new BadRequestException(
        'Fotoğraf yüklemek için müşterinin açık izni alınmalıdır.',
      );
    }

    return this.storePhoto(record.id, file, 'BUSINESS');
  }

  async finalizeForAppointment(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    const { appointment } = await this.assertCanManageRecord(
      barbershopId,
      appointmentId,
      userId,
    );
    const record = await this.prisma.haircutRecord.findUnique({
      where: { appointmentId: appointment.id },
      select: { finalizedAt: true, id: true },
    });

    if (!record) {
      throw new BadRequestException('Önce tıraş kaydı oluşturulmalıdır.');
    }

    if (record.finalizedAt) return record;

    return this.prisma.haircutRecord.update({
      where: { id: record.id },
      data: { finalizedAt: new Date() },
      select: { finalizedAt: true, id: true },
    });
  }

  async addPhotoForCustomer(
    appointmentId: string,
    customerId: string,
    file: Express.Multer.File | undefined,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
      select: {
        haircutRecord: { select: { id: true } },
        status: true,
      },
    });

    if (!appointment) throw new NotFoundException('Randevu bulunamadı.');
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Fotoğraf yalnız tamamlanmış randevuya eklenebilir.',
      );
    }
    if (!appointment.haircutRecord) {
      throw new BadRequestException('Bu randevu için henüz tıraş kaydı yok.');
    }

    return this.storePhoto(appointment.haircutRecord.id, file, 'CUSTOMER');
  }

  async getPhotoForCustomer(
    recordId: string,
    photoId: string,
    customerId: string,
  ) {
    const photo = await this.prisma.haircutPhoto.findFirst({
      where: {
        id: photoId,
        haircutRecordId: recordId,
        haircutRecord: { appointment: { customerId } },
      },
      select: { storageKey: true, mimeType: true },
    });

    if (!photo) {
      throw new NotFoundException('Fotoğraf bulunamadı.');
    }

    try {
      return {
        mimeType: photo.mimeType,
        buffer: await readFile(this.resolveStoragePath(photo.storageKey)),
      };
    } catch {
      throw new NotFoundException('Fotoğraf dosyası bulunamadı.');
    }
  }

  async getPhotoForBusiness(
    barbershopId: string,
    appointmentId: string,
    photoId: string,
    userId: string,
  ) {
    await this.assertCanManageRecord(barbershopId, appointmentId, userId);
    const photo = await this.prisma.haircutPhoto.findFirst({
      where: {
        id: photoId,
        haircutRecord: { appointmentId },
      },
      select: {
        storageKey: true,
        mimeType: true,
        haircutRecord: { select: { finalizedAt: true } },
      },
    });

    if (!photo) throw new NotFoundException('Fotoğraf bulunamadı.');
    if (photo.haircutRecord.finalizedAt) {
      throw new ForbiddenException(
        'Tamamlanan fotoğraf müşterinin özel tıraş geçmişine aittir.',
      );
    }

    try {
      return {
        mimeType: photo.mimeType,
        buffer: await readFile(this.resolveStoragePath(photo.storageKey)),
      };
    } catch {
      throw new NotFoundException('Fotoğraf dosyası bulunamadı.');
    }
  }

  private async assertCanManageRecord(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        completedAt: true,
        businessMember: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Tıraş kaydı yalnız tamamlanmış randevuya eklenebilir.',
      );
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true, role: true },
    });
    const canManageRecord =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));

    if (!canManageRecord || !membership) {
      throw new ForbiddenException('Bu tıraş kaydını düzenleme yetkin yok.');
    }

    return { appointment, membership };
  }

  private async storePhoto(
    haircutRecordId: string,
    file: Express.Multer.File | undefined,
    uploadedBy: 'BUSINESS' | 'CUSTOMER',
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('Bir fotoğraf dosyası gönderilmelidir.');
    }

    const extension = this.acceptedMimeTypes.get(file.mimetype);
    if (!extension) {
      throw new BadRequestException(
        'Yalnız JPEG, PNG veya WebP fotoğraf yüklenebilir.',
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Fotoğraf boyutu en fazla 5 MB olabilir.');
    }

    const storageKey = `haircut-photos/${randomUUID()}.${extension}`;
    const filePath = this.resolveStoragePath(storageKey);
    await mkdir(resolve(filePath, '..'), { recursive: true });
    await writeFile(filePath, file.buffer);

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const photoCount = await transaction.haircutPhoto.count({
          where: { haircutRecordId },
        });
        if (photoCount >= 8) {
          throw new BadRequestException(
            'Bir tıraş kaydına en fazla 8 fotoğraf eklenebilir.',
          );
        }

        const orderResult = await transaction.haircutPhoto.aggregate({
          where: { haircutRecordId },
          _max: { sortOrder: true },
        });
        return transaction.haircutPhoto.create({
          data: {
            haircutRecordId,
            storageKey,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            sortOrder: (orderResult._max.sortOrder ?? -1) + 1,
            customerConsentConfirmedAt: new Date(),
            uploadedBy,
          },
          select: {
            id: true,
            mimeType: true,
            sizeBytes: true,
            sortOrder: true,
          },
        });
      });
    } catch (error) {
      await this.prisma.haircutPhoto
        .deleteMany({ where: { storageKey } })
        .catch(() => undefined);
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
  }

  private resolveStoragePath(storageKey: string) {
    const fileName = basename(storageKey);
    return resolve(this.uploadsDirectory, 'haircut-photos', fileName);
  }
}
