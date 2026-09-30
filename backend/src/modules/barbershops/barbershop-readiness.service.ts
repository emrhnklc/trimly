import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export const barbershopReadinessRequirementLabels = {
  LOCATION: 'doğrulanmış işletme konumu',
  PHONE: 'işletme telefonu',
  PROFILE_PHOTO: 'profil fotoğrafı',
  COVER_PHOTO: 'kapak fotoğrafı',
  GALLERY_PHOTOS: 'en az 2 galeri fotoğrafı',
  ACTIVE_SERVICE: 'en az bir aktif hizmet',
  BOOKABLE_MEMBER: 'aktif hizmete atanmış randevuya açık çalışan',
  BUSINESS_HOURS: 'işletme çalışma saatleri',
  MEMBER_WORKING_HOURS: 'çalışanın hizmet süresine uygun vardiyası',
} as const;

export type BarbershopReadinessRequirement =
  keyof typeof barbershopReadinessRequirementLabels;

export type BarbershopReadiness = {
  acceptsBookings: boolean;
  isBookingOpen: boolean;
  isDiscoverable: boolean;
  isReadyToPublish: boolean;
  checks: {
    location: boolean;
    phone: boolean;
    profilePhoto: boolean;
    coverPhoto: boolean;
    galleryPhotos: boolean;
    activeService: boolean;
    bookableMember: boolean;
    businessHours: boolean;
    memberWorkingHours: boolean;
  };
  missingRequirements: Array<{
    code: BarbershopReadinessRequirement;
    label: string;
  }>;
};

@Injectable()
export class BarbershopReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async getReadiness(
    barbershopId: string,
    overrides?: {
      latitude?: number | null;
      longitude?: number | null;
      phone?: string | null;
      profileImageUrl?: string | null;
      coverImageUrl?: string | null;
    },
  ): Promise<BarbershopReadiness> {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        acceptsBookings: true,
        isDiscoverable: true,
        latitude: true,
        longitude: true,
        phone: true,
        profileImageUrl: true,
        coverImageUrl: true,
        galleryPhotos: { select: { id: true } },
        services: {
          where: { isActive: true },
          select: { id: true },
        },
        workingHours: {
          select: {
            weekday: true,
            startTime: true,
            endTime: true,
          },
        },
        members: {
          where: {
            isActive: true,
            isBookable: true,
            serviceAssignments: {
              some: { service: { isActive: true } },
            },
          },
          select: {
            workingHours: {
              select: {
                weekday: true,
                startTime: true,
                endTime: true,
              },
            },
            serviceAssignments: {
              where: { service: { isActive: true } },
              select: {
                service: { select: { durationMinutes: true } },
              },
            },
          },
        },
      },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const latitude =
      overrides?.latitude !== undefined
        ? overrides.latitude
        : barbershop.latitude;
    const longitude =
      overrides?.longitude !== undefined
        ? overrides.longitude
        : barbershop.longitude;
    const phone =
      overrides?.phone !== undefined ? overrides.phone : barbershop.phone;
    const profileImageUrl =
      overrides?.profileImageUrl !== undefined
        ? overrides.profileImageUrl
        : barbershop.profileImageUrl;
    const coverImageUrl =
      overrides?.coverImageUrl !== undefined
        ? overrides.coverImageUrl
        : barbershop.coverImageUrl;
    const checks = {
      location: latitude !== null && longitude !== null,
      phone: hasText(phone),
      profilePhoto: hasText(profileImageUrl),
      coverPhoto: hasText(coverImageUrl),
      galleryPhotos: barbershop.galleryPhotos.length >= 2,
      activeService: barbershop.services.length > 0,
      bookableMember: barbershop.members.length > 0,
      businessHours: barbershop.workingHours.length > 0,
      memberWorkingHours: barbershop.members.some((member) =>
        member.workingHours.some((memberHours) => {
          const businessHours = barbershop.workingHours.find(
            (hours) => hours.weekday === memberHours.weekday,
          );
          if (!businessHours) return false;

          const availableMinutes =
            Math.min(
              timeToMinutes(businessHours.endTime),
              timeToMinutes(memberHours.endTime),
            ) -
            Math.max(
              timeToMinutes(businessHours.startTime),
              timeToMinutes(memberHours.startTime),
            );

          return member.serviceAssignments.some(
            ({ service }) => availableMinutes >= service.durationMinutes,
          );
        }),
      ),
    };

    const requirementChecks: Array<[BarbershopReadinessRequirement, boolean]> =
      [
        ['LOCATION', checks.location],
        ['PHONE', checks.phone],
        ['PROFILE_PHOTO', checks.profilePhoto],
        ['COVER_PHOTO', checks.coverPhoto],
        ['GALLERY_PHOTOS', checks.galleryPhotos],
        ['ACTIVE_SERVICE', checks.activeService],
        ['BOOKABLE_MEMBER', checks.bookableMember],
        ['BUSINESS_HOURS', checks.businessHours],
        ['MEMBER_WORKING_HOURS', checks.memberWorkingHours],
      ];
    const missingRequirements = requirementChecks
      .filter(([, isComplete]) => !isComplete)
      .map(([code]) => ({
        code,
        label: barbershopReadinessRequirementLabels[code],
      }));

    const isReadyToPublish = missingRequirements.length === 0;

    return {
      acceptsBookings: barbershop.acceptsBookings,
      checks,
      isBookingOpen:
        barbershop.isDiscoverable &&
        barbershop.acceptsBookings &&
        isReadyToPublish,
      isDiscoverable: barbershop.isDiscoverable,
      isReadyToPublish,
      missingRequirements,
    };
  }

  async assertReadyToPublish(
    barbershopId: string,
    overrides?: {
      latitude?: number | null;
      longitude?: number | null;
      phone?: string | null;
      profileImageUrl?: string | null;
      coverImageUrl?: string | null;
    },
  ) {
    const readiness = await this.getReadiness(barbershopId, overrides);
    if (readiness.isReadyToPublish) return readiness;

    throw new BadRequestException({
      code: 'BARBERSHOP_NOT_READY',
      message: `İşletmeyi yayınlamak için eksik adımları tamamlamalısın: ${readiness.missingRequirements
        .map((requirement) => requirement.label)
        .join(', ')}.`,
    });
  }

  async assertBookingOpen(barbershopId: string) {
    const readiness = await this.getReadiness(barbershopId);
    if (readiness.isBookingOpen) return readiness;

    const reason = !readiness.isDiscoverable
      ? 'İşletme henüz yayında değil.'
      : !readiness.acceptsBookings
        ? 'İşletme şu anda yeni randevu kabul etmiyor.'
        : `İşletmenin randevu alabilmesi için eksik adımlar var: ${readiness.missingRequirements
            .map((requirement) => requirement.label)
            .join(', ')}.`;

    throw new ConflictException({
      statusCode: 409,
      code: 'BARBERSHOP_BOOKING_CLOSED',
      message: reason,
      missingRequirements: readiness.missingRequirements,
    });
  }
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
}
