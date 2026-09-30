import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { PrismaService } from '../../database/prisma.service';
import { UpsertReviewDto } from './dto/upsert-review.dto';
import { summarizeCustomerRatings } from './customer-weighted-rating';

const MAX_REVIEW_PHOTOS = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class ReviewsService {
  private readonly uploadsDirectory = resolve(
    process.cwd(),
    'uploads',
    'review-photos',
  );
  private readonly acceptedMimeTypes = new Map([
    ['image/jpeg', 'jpg'],
    ['image/png', 'png'],
    ['image/webp', 'webp'],
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    appointmentId: string,
    customerId: string,
    dto: UpsertReviewDto,
  ) {
    const appointment = await this.getCompletedCustomerAppointment(
      appointmentId,
      customerId,
    );
    const comment = dto.comment?.trim() || null;

    const review = await this.prisma.appointmentReview.upsert({
      where: { appointmentId },
      create: {
        appointmentId,
        barbershopId: appointment.barbershopId,
        businessMemberId: appointment.businessMemberId,
        customerId,
        rating: dto.rating,
        comment,
      },
      update: { rating: dto.rating, comment },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });

    return this.presentReview(review);
  }

  async addPhoto(
    appointmentId: string,
    customerId: string,
    file: Express.Multer.File | undefined,
  ) {
    await this.getCompletedCustomerAppointment(appointmentId, customerId);
    const review = await this.prisma.appointmentReview.findUnique({
      where: { appointmentId },
      include: { photos: { orderBy: { sortOrder: 'desc' }, take: 1 } },
    });

    if (!review || review.customerId !== customerId) {
      throw new BadRequestException(
        'Fotoğraf eklemeden önce puanını ve yorumunu kaydetmelisin.',
      );
    }

    const photoCount = await this.prisma.reviewPhoto.count({
      where: { reviewId: review.id },
    });
    if (photoCount >= MAX_REVIEW_PHOTOS) {
      throw new BadRequestException(
        'Bir yoruma en fazla 3 fotoğraf eklenebilir.',
      );
    }

    const saved = await this.saveImage(file);
    try {
      const photo = await this.prisma.reviewPhoto.create({
        data: {
          reviewId: review.id,
          storageKey: saved.storageKey,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
          sortOrder: (review.photos[0]?.sortOrder ?? -1) + 1,
        },
      });

      return { ...photo, url: this.photoUrl(review.id, photo.id) };
    } catch (error) {
      await this.deleteImage(saved.fileName);
      throw error;
    }
  }

  async removePhoto(
    appointmentId: string,
    photoId: string,
    customerId: string,
  ) {
    const photo = await this.prisma.reviewPhoto.findFirst({
      where: {
        id: photoId,
        review: { appointmentId, customerId },
      },
      select: { id: true, storageKey: true },
    });
    if (!photo) throw new NotFoundException('Yorum fotoğrafı bulunamadı.');

    await this.prisma.reviewPhoto.delete({ where: { id: photo.id } });
    await this.deleteImage(basename(photo.storageKey));
    return { deleted: true };
  }

  async remove(appointmentId: string, customerId: string) {
    const review = await this.prisma.appointmentReview.findFirst({
      where: { appointmentId, customerId },
      select: {
        id: true,
        photos: { select: { storageKey: true } },
      },
    });
    if (!review) throw new NotFoundException('Yorum bulunamadı.');

    await this.prisma.appointmentReview.delete({ where: { id: review.id } });
    await Promise.all(
      review.photos.map(({ storageKey }) =>
        this.deleteImage(basename(storageKey)),
      ),
    );
    return { deleted: true };
  }

  async findForBarbershop(barbershopId: string) {
    const [barbershop, summary, reviews] = await this.prisma.$transaction([
      this.prisma.barbershop.findUnique({
        where: { id: barbershopId },
        select: { id: true },
      }),
      this.prisma.appointmentReview.groupBy({
        by: ['customerId'],
        where: { barbershopId },
        orderBy: { customerId: 'asc' },
        _avg: { rating: true },
        _count: { _all: true },
      }),
      this.prisma.appointmentReview.findMany({
        where: { barbershopId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          customer: {
            select: {
              firstName: true,
              lastName: true,
              profileImageUrl: true,
            },
          },
          businessMember: {
            select: {
              id: true,
              user: { select: { firstName: true, lastName: true } },
            },
          },
          photos: { orderBy: { sortOrder: 'asc' } },
        },
      }),
    ]);

    if (!barbershop) throw new NotFoundException('İşletme bulunamadı.');

    return {
      ...summarizeCustomerRatings(summary),
      reviews: reviews.map((review) => ({
        ...this.presentReview(review),
        customer: {
          displayName: this.customerDisplayName(
            review.customer.firstName,
            review.customer.lastName,
          ),
          profileImageUrl: review.customer.profileImageUrl,
        },
        businessMember: review.businessMember,
      })),
    };
  }

  async getPhoto(reviewId: string, photoId: string) {
    const photo = await this.prisma.reviewPhoto.findFirst({
      where: { id: photoId, reviewId },
      select: { storageKey: true, mimeType: true },
    });
    if (!photo) throw new NotFoundException('Yorum fotoğrafı bulunamadı.');

    try {
      return {
        mimeType: photo.mimeType,
        buffer: await readFile(this.imagePath(basename(photo.storageKey))),
      };
    } catch {
      throw new NotFoundException('Yorum fotoğrafı dosyası bulunamadı.');
    }
  }

  private async getCompletedCustomerAppointment(
    appointmentId: string,
    customerId: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
      select: {
        id: true,
        status: true,
        barbershopId: true,
        businessMemberId: true,
      },
    });
    if (!appointment) throw new NotFoundException('Randevu bulunamadı.');
    if (appointment.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Yalnız tamamlanmış bir randevuya yorum yapabilirsin.',
      );
    }
    return appointment;
  }

  private async saveImage(file: Express.Multer.File | undefined) {
    if (!file?.buffer) {
      throw new BadRequestException('Bir fotoğraf dosyası gönderilmelidir.');
    }
    const extension = this.acceptedMimeTypes.get(file.mimetype);
    if (!extension || !this.hasValidImageSignature(file.buffer, extension)) {
      throw new BadRequestException(
        'Fotoğraflar JPEG, PNG veya WebP formatında olmalıdır.',
      );
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Fotoğraf en fazla 5 MB olabilir.');
    }

    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(this.uploadsDirectory, { recursive: true });
    await writeFile(this.imagePath(fileName), file.buffer, { flag: 'wx' });
    return {
      fileName,
      storageKey: `review-photos/${fileName}`,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  private hasValidImageSignature(buffer: Buffer, extension: string) {
    if (extension === 'jpg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (extension === 'png') {
      return buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }
    return (
      buffer.subarray(0, 4).equals(Buffer.from('RIFF')) &&
      buffer.subarray(8, 12).equals(Buffer.from('WEBP'))
    );
  }

  private presentReview(review: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    updatedAt: Date;
    photos: {
      id: string;
      mimeType: string;
      sizeBytes: number;
      sortOrder: number;
      createdAt: Date;
    }[];
  }) {
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      photos: review.photos.map((photo) => ({
        id: photo.id,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        sortOrder: photo.sortOrder,
        createdAt: photo.createdAt,
        url: this.photoUrl(review.id, photo.id),
      })),
    };
  }

  private photoUrl(reviewId: string, photoId: string) {
    return `/reviews/${reviewId}/photos/${photoId}`;
  }

  private customerDisplayName(firstName: string, lastName: string) {
    const initial = lastName.trim().charAt(0).toLocaleUpperCase('tr-TR');
    return initial ? `${firstName} ${initial}.` : firstName;
  }

  private imagePath(fileName: string) {
    return resolve(this.uploadsDirectory, basename(fileName));
  }

  private async deleteImage(fileName: string) {
    await unlink(this.imagePath(fileName)).catch(() => undefined);
  }
}
