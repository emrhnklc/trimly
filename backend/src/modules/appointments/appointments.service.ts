import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  AppointmentStatus,
  CampaignDiscountType,
  CampaignLoyaltyPeriod,
  CampaignRewardType,
  CampaignType,
  Prisma,
} from '@prisma/client';
import { DateTime } from 'luxon';
import { AvailabilityService } from '../availability/availability.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { RevenuePeriod } from './dto/revenue-summary-query.dto';

const portfolioStatusSelect = {
  id: true,
  status: true,
  title: true,
  requestedAt: true,
  respondedAt: true,
  revokedAt: true,
} as const;

const appointmentReviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  photos: {
    orderBy: { sortOrder: 'asc' as const },
    select: {
      id: true,
      mimeType: true,
      sizeBytes: true,
      sortOrder: true,
    },
  },
} as const;

const customerAppointmentSelect = {
  id: true,
  startsAt: true,
  endsAt: true,
  status: true,
  serviceId: true,
  serviceNameSnapshot: true,
  campaignTitleSnapshot: true,
  campaignBenefitSnapshot: true,
  campaignId: true,
  originalPriceSnapshot: true,
  discountAmount: true,
  priceSnapshot: true,
  durationMinutes: true,
  cancelledAt: true,
  completedAt: true,
  barbershop: {
    select: {
      id: true,
      name: true,
      slug: true,
      bookingSettings: {
        select: {
          customerCancellationEnabled: true,
          cancellationNoticeMinutes: true,
        },
      },
    },
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
} satisfies Prisma.AppointmentSelect;

const customerAppointmentDetailSelect = {
  ...customerAppointmentSelect,
  review: { select: appointmentReviewSelect },
  haircutRecord: {
    select: {
      id: true,
      styleName: true,
      notes: true,
      photos: {
        orderBy: { sortOrder: 'asc' as const },
        select: {
          id: true,
          mimeType: true,
          sizeBytes: true,
          sortOrder: true,
          portfolioItem: {
            select: portfolioStatusSelect,
          },
        },
      },
    },
  },
} satisfies Prisma.AppointmentSelect;

type CustomerAppointmentRecord = Prisma.AppointmentGetPayload<{
  select: typeof customerAppointmentSelect;
}>;

type CustomerAppointmentDetailRecord = Prisma.AppointmentGetPayload<{
  select: typeof customerAppointmentDetailSelect;
}>;

const defaultCancellationSettings = {
  customerCancellationEnabled: true,
  cancellationNoticeMinutes: 120,
};

// İşletmenin "Müşteri geldi" işaretini atlaması durumunda randevu, planlanan
// bitişinden bir saat sonra aktif listede takılı kalmasın. Bu süre dolmadan
// owner/manager randevuyu "Gelmedi" olarak işaretleyebilir.
const unmarkedAppointmentCompletionGraceMinutes = 60;

function getCancellationPolicy(
  status: AppointmentStatus,
  startsAt: Date,
  settings: typeof defaultCancellationSettings,
) {
  const cancellationDeadline = new Date(
    startsAt.getTime() - settings.cancellationNoticeMinutes * 60 * 1000,
  );

  if (status !== AppointmentStatus.CONFIRMED) {
    const statusReasons: Record<
      Exclude<AppointmentStatus, 'CONFIRMED'>,
      string
    > = {
      CANCELLED: 'Bu randevu iptal edilmiş.',
      ARRIVED: 'Müşterinin geldiği randevular iptal edilemez.',
      COMPLETED: 'Tamamlanan randevular iptal edilemez.',
      NO_SHOW: 'Gelinmedi olarak işaretlenen randevular iptal edilemez.',
    };

    return {
      canCancel: false,
      cancellationDeadline,
      cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
      cancellationReason: statusReasons[status],
    };
  }

  if (!settings.customerCancellationEnabled) {
    return {
      canCancel: false,
      cancellationDeadline,
      cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
      cancellationReason: 'Bu işletme müşteri tarafından iptale izin vermiyor.',
    };
  }

  if (new Date() >= cancellationDeadline) {
    return {
      canCancel: false,
      cancellationDeadline,
      cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
      cancellationReason: `Bu randevu en az ${settings.cancellationNoticeMinutes} dakika önceden iptal edilebilir.`,
    };
  }

  return {
    canCancel: true,
    cancellationDeadline,
    cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
    cancellationReason: null,
  };
}

function presentCustomerAppointment(appointment: CustomerAppointmentRecord) {
  const { bookingSettings, ...barbershop } = appointment.barbershop;
  const cancellationSettings = bookingSettings ?? defaultCancellationSettings;

  return {
    ...appointment,
    barbershop,
    ...getCancellationPolicy(
      appointment.status,
      appointment.startsAt,
      cancellationSettings,
    ),
  };
}

function presentCustomerAppointmentDetail(
  appointment: CustomerAppointmentDetailRecord,
) {
  const { haircutRecord, review, ...appointmentRecord } = appointment;

  return {
    ...presentCustomerAppointment(appointmentRecord),
    review: review
      ? {
          ...review,
          photos: review.photos.map((photo) => ({
            ...photo,
            url: `/reviews/${review.id}/photos/${photo.id}`,
          })),
        }
      : null,
    haircutRecord: haircutRecord
      ? {
          ...haircutRecord,
          photos: haircutRecord.photos.map((photo) => ({
            ...photo,
            url: `/haircut-records/${haircutRecord.id}/photos/${photo.id}`,
          })),
        }
      : null,
  };
}

@Injectable()
export class AppointmentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentsService.name);
  private reconciliationTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.reconciliationTimer = setInterval(() => {
      void this.reconcileAutoCompletedAppointments().catch((error: unknown) => {
        this.logger.error('Otomatik randevu tamamlama çalıştırılamadı.', error);
      });
    }, 30_000);
    this.reconciliationTimer.unref();
  }

  onModuleDestroy() {
    if (this.reconciliationTimer) clearInterval(this.reconciliationTimer);
  }

  private async reconcileAutoCompletedAppointments(where?: {
    barbershopId?: string;
    customerId?: string;
  }) {
    const now = new Date();
    const unmarkedAppointmentCompletionDeadline = new Date(
      now.getTime() - unmarkedAppointmentCompletionGraceMinutes * 60 * 1000,
    );

    await this.prisma.appointment.updateMany({
      where: {
        ...where,
        OR: [
          {
            status: AppointmentStatus.ARRIVED,
            autoCompleteAt: { lte: now },
          },
          {
            status: AppointmentStatus.CONFIRMED,
            endsAt: { lte: unmarkedAppointmentCompletionDeadline },
          },
        ],
      },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: now,
      },
    });
  }

  async create(
    barbershopId: string,
    customerId: string,
    dto: CreateAppointmentDto,
  ) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const requestedStart = DateTime.fromISO(dto.startsAt, { setZone: true });
    if (!requestedStart.isValid) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const localDate = requestedStart.setZone(barbershop.timezone).toISODate();
    if (!localDate) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const availability = await this.availabilityService.findAvailableSlots(
      barbershopId,
      {
        memberId: dto.memberId,
        serviceId: dto.serviceId,
        date: localDate,
      },
    );
    const selectedSlot = availability.slots.find(
      (slot) =>
        DateTime.fromISO(slot.startsAt).toMillis() ===
        requestedStart.toMillis(),
    );

    if (!selectedSlot) {
      throw new ConflictException('Seçilen saat artık uygun değil.');
    }

    const service = await this.prisma.service.findFirst({
      where: { id: dto.serviceId, barbershopId, isActive: true },
      select: {
        id: true,
        name: true,
        price: true,
        durationMinutes: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bulunamadı.');
    }

    try {
      const appointment = await this.prisma.$transaction(
        async (transaction) => {
          let campaignId: string | null = null;
          let campaignTitleSnapshot: string | null = null;
          let campaignBenefitSnapshot: string | null = null;
          let discountAmount = new Prisma.Decimal(0);

          if (dto.campaignId) {
            const now = new Date();
            const campaign = await transaction.campaign.findFirst({
              where: {
                id: dto.campaignId,
                barbershopId,
                isActive: true,
                startsAt: { lte: now },
                endsAt: { gt: now },
                services: { some: { serviceId: service.id } },
              },
              include: {
                barbershop: { select: { timezone: true } },
                services: { select: { serviceId: true } },
              },
            });
            if (!campaign) {
              throw new BadRequestException(
                'Kampanya bu hizmet için geçerli değil veya süresi dolmuş.',
              );
            }

            const totalUses = await transaction.appointment.count({
              where: {
                campaignId: campaign.id,
                status: { not: AppointmentStatus.CANCELLED },
              },
            });
            if (
              campaign.usageLimit !== null &&
              totalUses >= campaign.usageLimit
            ) {
              throw new ConflictException(
                'Kampanyanın kullanım limiti dolmuş.',
              );
            }
            if (campaign.campaignType === CampaignType.LOYALTY) {
              const periodStart =
                campaign.loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS
                  ? DateTime.fromJSDate(now)
                      .minus({ days: campaign.rollingPeriodDays ?? 30 })
                      .toJSDate()
                  : DateTime.fromJSDate(now)
                      .setZone(campaign.barbershop.timezone)
                      .startOf('month')
                      .toUTC()
                      .toJSDate();
              const [completedVisits, redeemedCount] = await Promise.all([
                transaction.appointment.count({
                  where: {
                    barbershopId,
                    customerId,
                    serviceId: {
                      in: campaign.services.map(({ serviceId }) => serviceId),
                    },
                    status: AppointmentStatus.COMPLETED,
                    completedAt: { gte: periodStart, lte: now },
                  },
                }),
                transaction.appointment.count({
                  where: {
                    campaignId: campaign.id,
                    customerId,
                    status: { not: AppointmentStatus.CANCELLED },
                    startsAt: { gte: periodStart },
                  },
                }),
              ]);
              if (
                completedVisits < (campaign.requiredCompletedVisits ?? 1) ||
                redeemedCount > 0
              ) {
                throw new ConflictException(
                  'Sadakat kampanyası için gereken ziyaret sayısı henüz tamamlanmadı veya bu dönemki hak kullanıldı.',
                );
              }
            } else {
              const customerUses = await transaction.appointment.count({
                where: {
                  campaignId: campaign.id,
                  customerId,
                  status: { not: AppointmentStatus.CANCELLED },
                },
              });
              if (customerUses >= campaign.perCustomerLimit) {
                throw new ConflictException(
                  'Bu kampanyanın kullanım hakkını tamamladın.',
                );
              }
            }

            if (
              campaign.rewardType === CampaignRewardType.DISCOUNT &&
              campaign.discountType &&
              campaign.discountValue
            ) {
              discountAmount =
                campaign.discountType === CampaignDiscountType.PERCENTAGE
                  ? service.price
                      .mul(campaign.discountValue)
                      .div(100)
                      .toDecimalPlaces(2)
                  : campaign.discountValue.gt(service.price)
                    ? service.price
                    : campaign.discountValue;
              campaignBenefitSnapshot =
                campaign.discountType === CampaignDiscountType.PERCENTAGE
                  ? `%${campaign.discountValue.toString()} indirim`
                  : `₺${campaign.discountValue.toString()} indirim`;
            } else {
              campaignBenefitSnapshot = campaign.giftDescription;
            }
            campaignId = campaign.id;
            campaignTitleSnapshot = campaign.title;
          }

          return transaction.appointment.create({
            data: {
              barbershopId,
              customerId,
              businessMemberId: dto.memberId,
              serviceId: service.id,
              campaignId,
              campaignTitleSnapshot,
              campaignBenefitSnapshot,
              serviceNameSnapshot: service.name,
              originalPriceSnapshot: service.price,
              discountAmount,
              priceSnapshot: service.price.sub(discountAmount),
              durationMinutes: service.durationMinutes,
              startsAt: new Date(selectedSlot.startsAt),
              endsAt: new Date(selectedSlot.endsAt),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      void this.notificationsService.notifyNewAppointment(appointment.id);

      return appointment;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === 'P2039' || error.code === 'P2034')
      ) {
        throw new ConflictException(
          'Bu saat az önce başka biri tarafından alındı.',
        );
      }

      throw error;
    }
  }

  async findForCustomer(customerId: string) {
    await this.reconcileAutoCompletedAppointments({ customerId });

    const appointments = await this.prisma.appointment.findMany({
      where: { customerId },
      orderBy: { startsAt: 'desc' },
      select: customerAppointmentSelect,
    });

    return appointments.map(presentCustomerAppointment);
  }

  async findOneForCustomer(appointmentId: string, customerId: string) {
    await this.reconcileAutoCompletedAppointments({ customerId });

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, customerId },
      select: customerAppointmentDetailSelect,
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    return presentCustomerAppointmentDetail(appointment);
  }

  async cancelForCustomer(appointmentId: string, customerId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        customerId: true,
        status: true,
        startsAt: true,
        barbershop: {
          select: {
            bookingSettings: {
              select: {
                customerCancellationEnabled: true,
                cancellationNoticeMinutes: true,
              },
            },
          },
        },
      },
    });

    if (!appointment || appointment.customerId !== customerId) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const cancellationSettings = appointment.barbershop.bookingSettings ?? {
      ...defaultCancellationSettings,
    };
    const cancellationPolicy = getCancellationPolicy(
      appointment.status,
      appointment.startsAt,
      cancellationSettings,
    );

    if (!cancellationPolicy.canCancel) {
      throw new BadRequestException(
        cancellationPolicy.cancellationReason ?? 'Bu randevu iptal edilemez.',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  async findForBarbershop(barbershopId: string) {
    await this.reconcileAutoCompletedAppointments({ barbershopId });

    return this.prisma.appointment.findMany({
      where: { barbershopId },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        arrivedAt: true,
        autoCompleteAt: true,
        completedAt: true,
        serviceNameSnapshot: true,
        campaignTitleSnapshot: true,
        campaignBenefitSnapshot: true,
        priceSnapshot: true,
        durationMinutes: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
          },
        },
        businessMember: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findForCurrentMember(barbershopId: string, userId: string) {
    await this.reconcileAutoCompletedAppointments({ barbershopId });

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true, role: true },
    });

    if (!membership?.isActive || membership.role === 'APPRENTICE') {
      throw new ForbiddenException('Randevuları görüntüleme yetkin yok.');
    }

    return this.prisma.appointment.findMany({
      where: { barbershopId, businessMemberId: membership.id },
      orderBy: { startsAt: 'desc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        status: true,
        arrivedAt: true,
        autoCompleteAt: true,
        completedAt: true,
        serviceNameSnapshot: true,
        campaignTitleSnapshot: true,
        campaignBenefitSnapshot: true,
        priceSnapshot: true,
        durationMinutes: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
          },
        },
        businessMember: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async findOneForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    await this.reconcileAutoCompletedAppointments({ barbershopId });

    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        serviceId: true,
        startsAt: true,
        endsAt: true,
        status: true,
        arrivedAt: true,
        autoCompleteAt: true,
        completedAt: true,
        cancelledAt: true,
        cancellationReason: true,
        serviceNameSnapshot: true,
        campaignTitleSnapshot: true,
        campaignBenefitSnapshot: true,
        priceSnapshot: true,
        durationMinutes: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            profileImageUrl: true,
          },
        },
        businessMember: {
          select: {
            id: true,
            userId: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                profileImageUrl: true,
              },
            },
          },
        },
        barbershop: { select: { id: true, name: true, timezone: true } },
        haircutRecord: {
          select: {
            id: true,
            styleName: true,
            notes: true,
            finalizedAt: true,
            photos: {
              orderBy: { sortOrder: 'asc' },
              where: { uploadedBy: 'BUSINESS' },
              select: {
                id: true,
                mimeType: true,
                sizeBytes: true,
                sortOrder: true,
                portfolioItem: {
                  select: portfolioStatusSelect,
                },
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { isActive: true, role: true },
    });
    const canView =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));

    if (!canView) {
      throw new ForbiddenException('Bu randevuyu görüntüleme yetkin yok.');
    }

    const completedVisitCount = await this.prisma.appointment.count({
      where: {
        barbershopId,
        customerId: appointment.customer.id,
        status: AppointmentStatus.COMPLETED,
      },
    });
    const businessMember = {
      id: appointment.businessMember.id,
      user: appointment.businessMember.user,
    };

    const businessHaircutRecord = appointment.haircutRecord;
    const haircutRecord = businessHaircutRecord
      ? {
          ...businessHaircutRecord,
          photos: businessHaircutRecord.photos.map((photo) => ({
            ...photo,
            url: businessHaircutRecord.finalizedAt
              ? null
              : `/barbershops/${barbershopId}/appointments/${appointment.id}/haircut-record/photos/${photo.id}`,
          })),
        }
      : null;

    return {
      ...appointment,
      businessMember,
      completedVisitCount,
      haircutRecord,
    };
  }

  async findDailySummary(barbershopId: string, date?: string) {
    await this.reconcileAutoCompletedAppointments({ barbershopId });

    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const day = date
      ? DateTime.fromISO(date, { zone: barbershop.timezone }).startOf('day')
      : DateTime.now().setZone(barbershop.timezone).startOf('day');

    if (!day.isValid) {
      throw new BadRequestException('Geçerli bir tarih gönderilmelidir.');
    }

    const appointments = await this.prisma.appointment.findMany({
      where: {
        barbershopId,
        startsAt: {
          gte: day.toUTC().toJSDate(),
          lt: day.plus({ days: 1 }).toUTC().toJSDate(),
        },
      },
      select: {
        status: true,
        priceSnapshot: true,
        businessMember: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const counts = {
      total: appointments.length,
      confirmed: 0,
      arrived: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };
    let completedRevenue = new Prisma.Decimal(0);
    const memberSummaries = new Map<
      string,
      {
        memberId: string;
        name: string;
        confirmed: number;
        arrived: number;
        completed: number;
        cancelled: number;
        noShow: number;
        completedRevenue: Prisma.Decimal;
      }
    >();

    for (const appointment of appointments) {
      const memberId = appointment.businessMember.id;
      const memberSummary = memberSummaries.get(memberId) ?? {
        memberId,
        name: `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`,
        confirmed: 0,
        arrived: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        completedRevenue: new Prisma.Decimal(0),
      };

      if (appointment.status === 'CONFIRMED') {
        counts.confirmed += 1;
        memberSummary.confirmed += 1;
      }
      if (appointment.status === 'ARRIVED') {
        counts.arrived += 1;
        memberSummary.arrived += 1;
      }
      if (appointment.status === 'COMPLETED') {
        counts.completed += 1;
        completedRevenue = completedRevenue.plus(appointment.priceSnapshot);
        memberSummary.completed += 1;
        memberSummary.completedRevenue = memberSummary.completedRevenue.plus(
          appointment.priceSnapshot,
        );
      }
      if (appointment.status === 'CANCELLED') {
        counts.cancelled += 1;
        memberSummary.cancelled += 1;
      }
      if (appointment.status === 'NO_SHOW') {
        counts.noShow += 1;
        memberSummary.noShow += 1;
      }

      memberSummaries.set(memberId, memberSummary);
    }

    return {
      date: day.toISODate(),
      timezone: barbershop.timezone,
      ...counts,
      completedRevenue: completedRevenue.toFixed(2),
      byMember: [...memberSummaries.values()].map((member) => ({
        ...member,
        completedRevenue: member.completedRevenue.toFixed(2),
      })),
    };
  }

  async findRevenueSummary(
    barbershopId: string,
    period = RevenuePeriod.WEEK,
    anchor?: string,
  ) {
    await this.reconcileAutoCompletedAppointments({ barbershopId });

    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: { timezone: true },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    const anchorDate = anchor
      ? DateTime.fromISO(anchor, { zone: barbershop.timezone }).startOf('day')
      : DateTime.now().setZone(barbershop.timezone).startOf('day');

    if (!anchorDate.isValid) {
      throw new BadRequestException('Geçerli bir tarih gönderilmelidir.');
    }

    const { end, previousStart, start } = this.getRevenuePeriodRange(
      anchorDate,
      period,
    );
    const buckets = this.createRevenueBuckets(start, end, period);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        barbershopId,
        startsAt: {
          gte: previousStart.toUTC().toJSDate(),
          lt: end.toUTC().toJSDate(),
        },
      },
      select: {
        startsAt: true,
        status: true,
        priceSnapshot: true,
        businessMember: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const counts = {
      total: 0,
      confirmed: 0,
      arrived: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
    };
    let totalRevenue = new Prisma.Decimal(0);
    let previousRevenue = new Prisma.Decimal(0);
    const memberSummaries = new Map<
      string,
      {
        memberId: string;
        name: string;
        completed: number;
        completedRevenue: Prisma.Decimal;
      }
    >();

    for (const appointment of appointments) {
      const startsAt = DateTime.fromJSDate(appointment.startsAt).setZone(
        barbershop.timezone,
      );
      const inCurrentPeriod = startsAt >= start && startsAt < end;

      if (!inCurrentPeriod) {
        if (appointment.status === 'COMPLETED') {
          previousRevenue = previousRevenue.plus(appointment.priceSnapshot);
        }
        continue;
      }

      counts.total += 1;
      if (appointment.status === 'CONFIRMED') counts.confirmed += 1;
      if (appointment.status === 'ARRIVED') counts.arrived += 1;
      if (appointment.status === 'CANCELLED') counts.cancelled += 1;
      if (appointment.status === 'NO_SHOW') counts.noShow += 1;

      if (appointment.status !== 'COMPLETED') continue;

      counts.completed += 1;
      totalRevenue = totalRevenue.plus(appointment.priceSnapshot);

      const bucket = buckets.find(
        (item) => startsAt >= item.start && startsAt < item.end,
      );
      if (bucket) {
        bucket.completed += 1;
        bucket.revenue = bucket.revenue.plus(appointment.priceSnapshot);
      }

      const memberId = appointment.businessMember.id;
      const memberSummary = memberSummaries.get(memberId) ?? {
        memberId,
        name: `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`,
        completed: 0,
        completedRevenue: new Prisma.Decimal(0),
      };
      memberSummary.completed += 1;
      memberSummary.completedRevenue = memberSummary.completedRevenue.plus(
        appointment.priceSnapshot,
      );
      memberSummaries.set(memberId, memberSummary);
    }

    const averageTicket = counts.completed
      ? totalRevenue.dividedBy(counts.completed)
      : new Prisma.Decimal(0);
    const previousRevenueNumber = previousRevenue.toNumber();
    const changePercentage = previousRevenueNumber
      ? Number(
          totalRevenue
            .minus(previousRevenue)
            .dividedBy(previousRevenue)
            .times(100)
            .toFixed(1),
        )
      : null;

    return {
      period,
      timezone: barbershop.timezone,
      rangeStart: start.toISODate(),
      rangeEnd: end.minus({ days: 1 }).toISODate(),
      ...counts,
      totalRevenue: totalRevenue.toFixed(2),
      previousRevenue: previousRevenue.toFixed(2),
      changePercentage,
      averageTicket: averageTicket.toFixed(2),
      points: buckets.map((bucket) => ({
        key: bucket.key,
        label: bucket.label,
        completed: bucket.completed,
        revenue: bucket.revenue.toFixed(2),
      })),
      byMember: [...memberSummaries.values()]
        .sort((first, second) =>
          second.completedRevenue.comparedTo(first.completedRevenue),
        )
        .map((member) => ({
          ...member,
          completedRevenue: member.completedRevenue.toFixed(2),
        })),
    };
  }

  private getRevenuePeriodRange(anchor: DateTime, period: RevenuePeriod) {
    if (period === RevenuePeriod.MONTH) {
      const start = anchor.startOf('month');
      return {
        start,
        end: start.plus({ months: 1 }),
        previousStart: start.minus({ months: 1 }),
      };
    }

    if (period === RevenuePeriod.YEAR) {
      const start = anchor.startOf('year');
      return {
        start,
        end: start.plus({ years: 1 }),
        previousStart: start.minus({ years: 1 }),
      };
    }

    const start = anchor.startOf('week');
    return {
      start,
      end: start.plus({ weeks: 1 }),
      previousStart: start.minus({ weeks: 1 }),
    };
  }

  private createRevenueBuckets(
    start: DateTime,
    end: DateTime,
    period: RevenuePeriod,
  ) {
    const buckets: Array<{
      key: string;
      label: string;
      start: DateTime;
      end: DateTime;
      completed: number;
      revenue: Prisma.Decimal;
    }> = [];
    let cursor = start;

    while (cursor < end) {
      const bucketEnd = DateTime.min(
        period === RevenuePeriod.WEEK
          ? cursor.plus({ days: 1 })
          : period === RevenuePeriod.MONTH
            ? cursor.plus({ days: 7 })
            : cursor.plus({ months: 1 }),
        end,
      );
      const label =
        period === RevenuePeriod.WEEK
          ? cursor.setLocale('tr').toFormat('ccc').replace('.', '')
          : period === RevenuePeriod.MONTH
            ? `${cursor.day}–${bucketEnd.minus({ days: 1 }).day}`
            : cursor.setLocale('tr').toFormat('LLL').replace('.', '');

      buckets.push({
        key: cursor.toISODate()!,
        label,
        start: cursor,
        end: bucketEnd,
        completed: 0,
        revenue: new Prisma.Decimal(0),
      });
      cursor = bucketEnd;
    }

    return buckets;
  }

  async findNextForCurrentMember(barbershopId: string, userId: string) {
    await this.reconcileAutoCompletedAppointments({ barbershopId });

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true, role: true },
    });

    if (!membership?.isActive || membership.role === 'APPRENTICE') {
      throw new ForbiddenException('Bu işletmenin aktif çalışanı değilsin.');
    }

    const appointment = await this.prisma.appointment.findFirst({
      where: {
        barbershopId,
        businessMemberId: membership.id,
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED],
        },
        OR: [
          { status: AppointmentStatus.ARRIVED },
          { startsAt: { gte: new Date() } },
        ],
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
        serviceNameSnapshot: true,
        durationMinutes: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!appointment) {
      return null;
    }

    const completedVisitCount = await this.prisma.appointment.count({
      where: {
        barbershopId,
        customerId: appointment.customer.id,
        status: 'COMPLETED',
      },
    });

    return { ...appointment, completedVisitCount };
  }

  async completeForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        startsAt: true,
        businessMember: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { isActive: true, role: true },
    });
    const canComplete =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));

    if (!canComplete) {
      throw new ForbiddenException('Bu randevuyu tamamlama yetkin yok.');
    }

    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.ARRIVED
    ) {
      throw new BadRequestException('Bu randevu tamamlanamaz.');
    }

    if (new Date() < appointment.startsAt) {
      throw new BadRequestException(
        'Randevu, başlangıç saati gelmeden tamamlanamaz.',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        autoCompleteAt: null,
      },
    });
  }

  async markArrivedForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    const appointment = await this.findManageableAppointment(
      barbershopId,
      appointmentId,
      userId,
      {
        startsAt: true,
        endsAt: true,
        durationMinutes: true,
      },
    );

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(
        'Bu randevu için geliş kaydı oluşturulamaz.',
      );
    }

    const now = new Date();
    if (now < appointment.startsAt) {
      throw new BadRequestException(
        'Müşteri gelişi randevu saati geldiğinde işaretlenebilir.',
      );
    }

    const arrivedAt = now;
    const arrivedServiceEnd = new Date(
      arrivedAt.getTime() + appointment.durationMinutes * 60 * 1000,
    );
    const autoCompleteAt =
      appointment.endsAt > arrivedServiceEnd
        ? appointment.endsAt
        : arrivedServiceEnd;

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.ARRIVED,
        arrivedAt,
        autoCompleteAt,
      },
    });
  }

  async undoArrivalForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    const appointment = await this.findManageableAppointment(
      barbershopId,
      appointmentId,
      userId,
    );

    if (appointment.status !== AppointmentStatus.ARRIVED) {
      throw new BadRequestException('Bu randevunun geliş kaydı geri alınamaz.');
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        arrivedAt: null,
        autoCompleteAt: null,
      },
    });
  }

  async cancelForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    dto: CancelAppointmentDto,
  ) {
    const appointment = await this.findManageableAppointment(
      barbershopId,
      appointmentId,
      userId,
    );

    if (
      appointment.status !== AppointmentStatus.CONFIRMED &&
      appointment.status !== AppointmentStatus.ARRIVED
    ) {
      throw new BadRequestException('Bu randevu iptal edilemez.');
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: dto.reason?.trim(),
        arrivedAt: null,
        autoCompleteAt: null,
      },
    });
  }

  async rescheduleForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    dto: RescheduleAppointmentDto,
  ) {
    const appointment = await this.findManageableAppointment(
      barbershopId,
      appointmentId,
      userId,
      {
        serviceId: true,
        businessMemberId: true,
        barbershop: { select: { timezone: true } },
      },
    );

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu yeniden planlanamaz.');
    }

    const requestedStart = DateTime.fromISO(dto.startsAt, { setZone: true });
    if (!requestedStart.isValid) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const date = requestedStart
      .setZone(appointment.barbershop.timezone)
      .toISODate();
    if (!date) {
      throw new BadRequestException(
        'Geçerli bir başlangıç zamanı gönderilmelidir.',
      );
    }

    const memberId = dto.memberId ?? appointment.businessMemberId;
    const availability = await this.availabilityService.findAvailableSlots(
      barbershopId,
      { memberId, serviceId: appointment.serviceId, date },
      { excludeAppointmentId: appointment.id, ignoreBookingWindow: true },
    );
    const selectedSlot = availability.slots.find(
      (slot) =>
        DateTime.fromISO(slot.startsAt).toMillis() ===
        requestedStart.toMillis(),
    );

    if (!selectedSlot) {
      throw new ConflictException('Yeni seçilen saat uygun değil.');
    }

    try {
      return await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          businessMemberId: memberId,
          startsAt: new Date(selectedSlot.startsAt),
          endsAt: new Date(selectedSlot.endsAt),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2039'
      ) {
        throw new ConflictException(
          'Bu saat az önce başka biri tarafından alındı.',
        );
      }

      throw error;
    }
  }

  async markNoShowForBusiness(
    barbershopId: string,
    appointmentId: string,
    userId: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        startsAt: true,
        businessMember: { select: { userId: true } },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { isActive: true, role: true },
    });
    const canMarkNoShow =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));

    if (!canMarkNoShow) {
      throw new ForbiddenException(
        'Bu randevuyu no-show işaretleme yetkin yok.',
      );
    }

    if (appointment.status !== 'CONFIRMED') {
      throw new BadRequestException('Bu randevu no-show işaretlenemez.');
    }

    if (new Date() < appointment.startsAt) {
      throw new BadRequestException(
        'Müşteri ancak randevu saati geldikten sonra gelmedi işaretlenebilir.',
      );
    }

    return this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: 'NO_SHOW' },
    });
  }

  private async findManageableAppointment<
    ExtraSelect extends Prisma.AppointmentSelect,
  >(
    barbershopId: string,
    appointmentId: string,
    userId: string,
    extraSelect?: ExtraSelect,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, barbershopId },
      select: {
        id: true,
        status: true,
        businessMember: { select: { userId: true } },
        ...extraSelect,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Randevu bulunamadı.');
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { isActive: true, role: true },
    });
    const canManage =
      membership?.isActive &&
      (membership.role === 'OWNER' ||
        membership.role === 'MANAGER' ||
        (membership.role === 'BARBER' &&
          appointment.businessMember.userId === userId));

    if (!canManage) {
      throw new ForbiddenException('Bu randevuyu yönetme yetkin yok.');
    }

    return appointment;
  }
}
