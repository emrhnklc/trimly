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
      select: { id: true, role: true },
    });
    const canManageRecord =
      membership?.role === 'OWNER' ||
      membership?.role === 'MANAGER' ||
      appointment.businessMember.userId === userId;

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
    file: Express.Multer.File | undefined,
  ) {
    const { appointment } = await this.assertCanManageRecord(
      barbershopId,
      appointmentId,
      userId,
    );
    const record = await this.prisma.haircutRecord.findUnique({
      where: { appointmentId: appointment.id },
      select: { id: true },
    });

    if (!record) {
      throw new BadRequestException(
        'Fotoğraf eklemeden önce tıraş kaydı oluşturulmalıdır.',
      );
    }

    if (!file || !file.buffer) {
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
      const sortOrder = await this.nextPhotoSortOrder(record.id);
      return await this.prisma.haircutPhoto.create({
        data: {
          haircutRecordId: record.id,
          storageKey,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          sortOrder,
        },
        select: { id: true, mimeType: true, sizeBytes: true, sortOrder: true },
      });
    } catch (error) {
      await unlink(filePath).catch(() => undefined);
      throw error;
    }
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
      select: { id: true, role: true },
    });
    const canManageRecord =
      membership?.role === 'OWNER' ||
      membership?.role === 'MANAGER' ||
      appointment.businessMember.userId === userId;

    if (!canManageRecord || !membership) {
      throw new ForbiddenException('Bu tıraş kaydını düzenleme yetkin yok.');
    }

    return { appointment, membership };
  }

  private async nextPhotoSortOrder(haircutRecordId: string) {
    const result = await this.prisma.haircutPhoto.aggregate({
      where: { haircutRecordId },
      _max: { sortOrder: true },
    });

    return (result._max.sortOrder ?? -1) + 1;
  }

  private resolveStoragePath(storageKey: string) {
    const fileName = basename(storageKey);
    return resolve(this.uploadsDirectory, 'haircut-photos', fileName);
  }
}
