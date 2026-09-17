import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AppointmentStatus,
  BarbershopAccessMode,
  CampaignDiscountType,
  CampaignLoyaltyPeriod,
  CampaignRewardType,
  CampaignType,
  Prisma,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

const maxImageSize = 5 * 1024 * 1024;

export const campaignInclude = {
  barbershop: {
    select: {
      id: true,
      name: true,
      slug: true,
      profileImageUrl: true,
      coverImageUrl: true,
      timezone: true,
    },
  },
  services: {
    select: {
      service: {
        select: { id: true, name: true, price: true, durationMinutes: true },
      },
    },
  },
  _count: {
    select: {
      appointments: { where: { status: { not: AppointmentStatus.CANCELLED } } },
    },
  },
} satisfies Prisma.CampaignInclude;

export type CampaignWithRelations = Prisma.CampaignGetPayload<{
  include: typeof campaignInclude;
}>;

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async findActivePublic(customerId: string) {
    const now = new Date();
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
        barbershop: {
          isDiscoverable: true,
          accessMode: BarbershopAccessMode.PUBLIC,
        },
      },
      include: campaignInclude,
      orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }],
    });
    return this.withCustomerProgress(
      campaigns.filter((campaign) => this.hasRemainingUsage(campaign)),
      customerId,
      now,
    );
  }

  async findActiveForBarbershop(barbershopId: string, customerId: string) {
    const now = new Date();
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        barbershopId,
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      include: campaignInclude,
      orderBy: [{ endsAt: 'asc' }, { createdAt: 'desc' }],
    });
    return this.withCustomerProgress(
      campaigns.filter((campaign) => this.hasRemainingUsage(campaign)),
      customerId,
      now,
    );
  }

  findForManagement(barbershopId: string) {
    return this.prisma.campaign.findMany({
      where: { barbershopId },
      include: campaignInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneForManagement(barbershopId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, barbershopId },
      include: campaignInclude,
    });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı.');
    return campaign;
  }

  async create(barbershopId: string, userId: string, dto: CreateCampaignDto) {
    const member = await this.requireManager(barbershopId, userId);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const rewardType = this.resolveRewardType(dto.campaignType, dto.rewardType);
    const discountValue = dto.discountValue
      ? new Prisma.Decimal(dto.discountValue)
      : null;

    await this.validateCampaign({
      barbershopId,
      campaignType: dto.campaignType,
      discountType: dto.discountType ?? null,
      discountValue,
      endsAt,
      giftDescription: dto.giftDescription?.trim() || null,
      loyaltyPeriod: dto.loyaltyPeriod ?? null,
      requiredCompletedVisits: dto.requiredCompletedVisits ?? null,
      rewardType,
      rollingPeriodDays: dto.rollingPeriodDays ?? null,
      serviceIds: dto.serviceIds,
      startsAt,
    });

    return this.prisma.campaign.create({
      data: {
        barbershopId,
        createdByMemberId: member.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        campaignType: dto.campaignType,
        rewardType,
        discountType:
          rewardType === CampaignRewardType.DISCOUNT ? dto.discountType : null,
        discountValue:
          rewardType === CampaignRewardType.DISCOUNT ? discountValue : null,
        giftDescription:
          rewardType === CampaignRewardType.GIFT
            ? dto.giftDescription?.trim()
            : null,
        requiredCompletedVisits:
          dto.campaignType === CampaignType.LOYALTY
            ? dto.requiredCompletedVisits
            : null,
        loyaltyPeriod:
          dto.campaignType === CampaignType.LOYALTY ? dto.loyaltyPeriod : null,
        rollingPeriodDays:
          dto.campaignType === CampaignType.LOYALTY &&
          dto.loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS
            ? dto.rollingPeriodDays
            : null,
        startsAt,
        endsAt,
        usageLimit: dto.usageLimit,
        perCustomerLimit: dto.perCustomerLimit ?? 1,
        services: {
          createMany: {
            data: dto.serviceIds.map((serviceId) => ({ serviceId })),
          },
        },
      },
      include: campaignInclude,
    });
  }

  async update(
    barbershopId: string,
    campaignId: string,
    userId: string,
    dto: UpdateCampaignDto,
  ) {
    await this.requireManager(barbershopId, userId);
    const current = await this.prisma.campaign.findFirst({
      where: { id: campaignId, barbershopId },
      include: { services: { select: { serviceId: true } } },
    });
    if (!current) throw new NotFoundException('Kampanya bulunamadı.');

    const campaignType = dto.campaignType ?? current.campaignType;
    const rewardType = this.resolveRewardType(
      campaignType,
      dto.rewardType ?? current.rewardType,
    );
    const serviceIds =
      dto.serviceIds ?? current.services.map(({ serviceId }) => serviceId);
    const discountType =
      rewardType === CampaignRewardType.DISCOUNT
        ? (dto.discountType ?? current.discountType)
        : null;
    const discountValue =
      rewardType === CampaignRewardType.DISCOUNT
        ? dto.discountValue
          ? new Prisma.Decimal(dto.discountValue)
          : current.discountValue
        : null;
    const giftDescription =
      rewardType === CampaignRewardType.GIFT
        ? dto.giftDescription === undefined
          ? current.giftDescription
          : dto.giftDescription?.trim() || null
        : null;
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : current.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : current.endsAt;
    const requiredCompletedVisits =
      campaignType === CampaignType.LOYALTY
        ? dto.requiredCompletedVisits === undefined
          ? current.requiredCompletedVisits
          : dto.requiredCompletedVisits
        : null;
    const loyaltyPeriod =
      campaignType === CampaignType.LOYALTY
        ? dto.loyaltyPeriod === undefined
          ? current.loyaltyPeriod
          : dto.loyaltyPeriod
        : null;
    const rollingPeriodDays =
      loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS
        ? dto.rollingPeriodDays === undefined
          ? current.rollingPeriodDays
          : dto.rollingPeriodDays
        : null;

    await this.validateCampaign({
      barbershopId,
      campaignType,
      discountType,
      discountValue,
      endsAt,
      giftDescription,
      loyaltyPeriod,
      requiredCompletedVisits,
      rewardType,
      rollingPeriodDays,
      serviceIds,
      startsAt,
    });

    return this.prisma.$transaction(async (transaction) => {
      if (dto.serviceIds) {
        await transaction.campaignService.deleteMany({
          where: { campaignId },
        });
        await transaction.campaignService.createMany({
          data: serviceIds.map((serviceId) => ({ campaignId, serviceId })),
        });
      }
      return transaction.campaign.update({
        where: { id: campaignId },
        data: {
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.description !== undefined && {
            description: dto.description.trim() || null,
          }),
          campaignType,
          rewardType,
          discountType,
          discountValue,
          giftDescription,
          requiredCompletedVisits,
          loyaltyPeriod,
          rollingPeriodDays,
          ...(dto.startsAt !== undefined && { startsAt }),
          ...(dto.endsAt !== undefined && { endsAt }),
          ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
          ...(dto.perCustomerLimit !== undefined && {
            perCustomerLimit: dto.perCustomerLimit,
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
        include: campaignInclude,
      });
    });
  }

  async updateImage(
    barbershopId: string,
    campaignId: string,
    userId: string,
    file: Express.Multer.File | undefined,
    publicBaseUrl: string,
  ) {
    await this.requireManager(barbershopId, userId);
    if (!file)
      throw new BadRequestException('Bir kampanya fotoğrafı gönderilmelidir.');
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, barbershopId },
      select: { id: true, imageUrl: true },
    });
    if (!campaign) throw new NotFoundException('Kampanya bulunamadı.');

    const saved = await this.saveImage(file);
    try {
      const updated = await this.prisma.campaign.update({
        where: { id: campaignId },
        data: {
          imageUrl: new URL(
            `/barbershops/images/${saved}`,
            publicBaseUrl,
          ).toString(),
        },
        include: campaignInclude,
      });
      if (campaign.imageUrl?.includes('/barbershops/images/')) {
        await this.deleteImage(basename(campaign.imageUrl));
      }
      return updated;
    } catch (error) {
      await this.deleteImage(saved);
      throw error;
    }
  }

  getLoyaltyWindowStart(
    campaign: {
      loyaltyPeriod: CampaignLoyaltyPeriod | null;
      rollingPeriodDays: number | null;
      barbershop: { timezone: string };
    },
    now = new Date(),
  ) {
    if (campaign.loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS) {
      return DateTime.fromJSDate(now)
        .minus({ days: campaign.rollingPeriodDays ?? 30 })
        .toJSDate();
    }
    return DateTime.fromJSDate(now)
      .setZone(campaign.barbershop.timezone)
      .startOf('month')
      .toUTC()
      .toJSDate();
  }

  private async withCustomerProgress(
    campaigns: CampaignWithRelations[],
    customerId: string,
    now: Date,
  ) {
    return Promise.all(
      campaigns.map(async (campaign) => {
        if (campaign.campaignType !== CampaignType.LOYALTY) {
          return { ...campaign, customerProgress: null };
        }
        const periodStart = this.getLoyaltyWindowStart(campaign, now);
        const serviceIds = campaign.services.map(({ service }) => service.id);
        const [completedVisits, redeemedCount] = await Promise.all([
          this.prisma.appointment.count({
            where: {
              barbershopId: campaign.barbershopId,
              customerId,
              serviceId: { in: serviceIds },
              status: AppointmentStatus.COMPLETED,
              completedAt: { gte: periodStart, lte: now },
            },
          }),
          this.prisma.appointment.count({
            where: {
              campaignId: campaign.id,
              customerId,
              status: { not: AppointmentStatus.CANCELLED },
              startsAt: { gte: periodStart },
            },
          }),
        ]);
        const requiredVisits = campaign.requiredCompletedVisits ?? 1;
        return {
          ...campaign,
          customerProgress: {
            completedVisits,
            isEligible:
              completedVisits >= requiredVisits && redeemedCount === 0,
            redeemedCount,
            requiredVisits,
            remainingVisits: Math.max(0, requiredVisits - completedVisits),
          },
        };
      }),
    );
  }

  private resolveRewardType(
    campaignType: CampaignType,
    rewardType?: CampaignRewardType,
  ) {
    if (campaignType === CampaignType.GIFT) return CampaignRewardType.GIFT;
    if (campaignType === CampaignType.PRICE_DISCOUNT)
      return CampaignRewardType.DISCOUNT;
    return rewardType ?? CampaignRewardType.DISCOUNT;
  }

  private hasRemainingUsage(campaign: {
    usageLimit: number | null;
    _count: { appointments: number };
  }) {
    return (
      campaign.usageLimit === null ||
      campaign._count.appointments < campaign.usageLimit
    );
  }

  private async requireManager(barbershopId: string, userId: string) {
    const member = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true, role: true },
    });
    if (
      !member?.isActive ||
      (member.role !== 'OWNER' && member.role !== 'MANAGER')
    ) {
      throw new ForbiddenException('Kampanya yönetme yetkin yok.');
    }
    return member;
  }

  private async validateCampaign(input: {
    barbershopId: string;
    campaignType: CampaignType;
    discountType: CampaignDiscountType | null;
    discountValue: Prisma.Decimal | null;
    endsAt: Date;
    giftDescription: string | null;
    loyaltyPeriod: CampaignLoyaltyPeriod | null;
    requiredCompletedVisits: number | null;
    rewardType: CampaignRewardType;
    rollingPeriodDays: number | null;
    serviceIds: string[];
    startsAt: Date;
  }) {
    if (input.endsAt <= input.startsAt) {
      throw new BadRequestException(
        'Kampanya bitişi başlangıçtan sonra olmalıdır.',
      );
    }
    if (input.endsAt <= new Date()) {
      throw new BadRequestException('Kampanya bitiş tarihi geçmiş olamaz.');
    }
    if (input.rewardType === CampaignRewardType.DISCOUNT) {
      if (
        !input.discountType ||
        !input.discountValue ||
        input.discountValue.lte(0) ||
        (input.discountType === CampaignDiscountType.PERCENTAGE &&
          input.discountValue.gt(100))
      ) {
        throw new BadRequestException('İndirim tutarı geçerli değil.');
      }
    } else if (!input.giftDescription?.trim()) {
      throw new BadRequestException('Hediye içeriği yazılmalıdır.');
    }
    if (
      input.campaignType === CampaignType.LOYALTY &&
      (!input.requiredCompletedVisits ||
        !input.loyaltyPeriod ||
        (input.loyaltyPeriod === CampaignLoyaltyPeriod.ROLLING_DAYS &&
          !input.rollingPeriodDays))
    ) {
      throw new BadRequestException('Sadakat kampanyası koşulları eksik.');
    }

    const services = await this.prisma.service.findMany({
      where: {
        id: { in: input.serviceIds },
        barbershopId: input.barbershopId,
        isActive: true,
      },
      select: { id: true },
    });
    if (services.length !== input.serviceIds.length) {
      throw new BadRequestException(
        'Kampanya yalnız işletmenin aktif hizmetlerine uygulanabilir.',
      );
    }
  }

  private async saveImage(file: Express.Multer.File) {
    const extension = this.imageExtension(file.buffer, file.mimetype);
    if (file.size > maxImageSize || !extension) {
      throw new BadRequestException(
        'Fotoğraf JPEG, PNG veya WebP ve en fazla 5 MB olmalıdır.',
      );
    }
    const fileName = `${randomUUID()}.${extension}`;
    await mkdir(resolve(process.cwd(), 'uploads', 'barbershop-photos'), {
      recursive: true,
    });
    await writeFile(this.imagePath(fileName), file.buffer, { flag: 'wx' });
    return fileName;
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
}
