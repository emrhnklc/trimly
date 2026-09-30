import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../database/prisma.service';
import {
  UpdateWorkingHoursDto,
  WorkingHoursItemDto,
} from './dto/update-working-hours.dto';
import { UpdateMemberWorkingHoursDto } from './dto/update-member-working-hours.dto';
import { CreateMemberScheduleBlockDto } from './dto/create-member-schedule-block.dto';
import {
  orderedWeekdays,
  serializeWorkingHours,
  workingHoursForDate,
  type EffectiveWorkingHours,
} from './effective-working-hours';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findWorkingHours(barbershopId: string, planned = false) {
    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        timezone: true,
        previousWorkingHours: true,
        workingHoursEffectiveFrom: true,
        workingHours: {
          orderBy: { weekday: 'asc' },
          select: { weekday: true, startTime: true, endTime: true },
        },
      },
    });
    if (!barbershop) throw new NotFoundException('İşletme bulunamadı.');
    if (planned) return barbershop.workingHours;
    return workingHoursForDate(
      barbershop.workingHours,
      barbershop.previousWorkingHours,
      barbershop.workingHoursEffectiveFrom,
      DateTime.now().setZone(barbershop.timezone),
    );
  }

  async replaceWorkingHours(barbershopId: string, dto: UpdateWorkingHoursDto) {
    this.validateWorkingHours(dto.hours);

    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        timezone: true,
        previousWorkingHours: true,
        workingHoursEffectiveFrom: true,
        workingHours: {
          select: { weekday: true, startTime: true, endTime: true },
        },
      },
    });
    if (!barbershop) throw new NotFoundException('İşletme bulunamadı.');
    const now = DateTime.now().setZone(barbershop.timezone);
    const activeHours = workingHoursForDate(
      barbershop.workingHours,
      barbershop.previousWorkingHours,
      barbershop.workingHoursEffectiveFrom,
      now,
    );
    const effectiveFrom = barbershop.workingHours.length
      ? await this.safeBusinessHoursEffectiveFrom(
          barbershopId,
          barbershop.timezone,
          dto.hours,
        )
      : now;

    await this.prisma.$transaction([
      this.prisma.barbershop.update({
        where: { id: barbershopId },
        data: {
          previousWorkingHours: serializeWorkingHours(activeHours),
          workingHoursEffectiveFrom: effectiveFrom.toUTC().toJSDate(),
        },
      }),
      this.prisma.workingHours.deleteMany({ where: { barbershopId } }),
      this.prisma.workingHours.createMany({
        data: dto.hours.map((hour) => ({
          barbershopId,
          weekday: hour.weekday,
          startTime: hour.startTime,
          endTime: hour.endTime,
        })),
      }),
    ]);

    return this.findWorkingHours(barbershopId, true);
  }

  async findMemberWorkingHours(
    barbershopId: string,
    memberId: string,
    planned = false,
  ) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: {
        previousWorkingHours: true,
        workingHoursEffectiveFrom: true,
        barbershop: { select: { timezone: true } },
        workingHours: {
          orderBy: { weekday: 'asc' },
          select: { weekday: true, startTime: true, endTime: true },
        },
      },
    });
    if (!member) throw new NotFoundException('Çalışan bu işletmeye ait değil.');
    if (planned) return member.workingHours;
    return workingHoursForDate(
      member.workingHours,
      member.previousWorkingHours,
      member.workingHoursEffectiveFrom,
      DateTime.now().setZone(member.barbershop.timezone),
    );
  }

  async findCurrentMemberWorkingHours(barbershopId: string, userId: string) {
    const membership = await this.prisma.businessMember.findUnique({
      where: { userId_barbershopId: { userId, barbershopId } },
      select: { id: true, isActive: true },
    });

    if (!membership?.isActive) {
      throw new ForbiddenException('Bu işletmenin aktif çalışanı değilsin.');
    }

    return this.findMemberWorkingHours(barbershopId, membership.id);
  }

  async replaceMemberWorkingHours(
    barbershopId: string,
    memberId: string,
    dto: UpdateMemberWorkingHoursDto,
  ) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);
    this.validateWorkingHours(dto.hours);
    await this.validateMemberHoursAgainstBusinessHours(barbershopId, dto.hours);

    const member = await this.prisma.businessMember.findUnique({
      where: { id: memberId },
      select: {
        previousWorkingHours: true,
        workingHoursEffectiveFrom: true,
        barbershop: { select: { timezone: true } },
        workingHours: {
          select: { weekday: true, startTime: true, endTime: true },
        },
      },
    });
    if (!member) throw new NotFoundException('Çalışan bulunamadı.');
    const now = DateTime.now().setZone(member.barbershop.timezone);
    const activeHours = workingHoursForDate(
      member.workingHours,
      member.previousWorkingHours,
      member.workingHoursEffectiveFrom,
      now,
    );
    const effectiveFrom = member.workingHours.length
      ? await this.safeMemberHoursEffectiveFrom(
          memberId,
          member.barbershop.timezone,
          dto.hours,
        )
      : now;

    await this.prisma.$transaction([
      this.prisma.businessMember.update({
        where: { id: memberId },
        data: {
          previousWorkingHours: serializeWorkingHours(activeHours),
          workingHoursEffectiveFrom: effectiveFrom.toUTC().toJSDate(),
        },
      }),
      this.prisma.memberWorkingHours.deleteMany({
        where: { businessMemberId: memberId },
      }),
      this.prisma.memberWorkingHours.createMany({
        data: dto.hours.map((hour) => ({
          businessMemberId: memberId,
          weekday: hour.weekday,
          startTime: hour.startTime,
          endTime: hour.endTime,
        })),
      }),
    ]);

    return this.findMemberWorkingHours(barbershopId, memberId, true);
  }

  private async safeBusinessHoursEffectiveFrom(
    barbershopId: string,
    timezone: string,
    hours: EffectiveWorkingHours[],
  ) {
    return this.safeHoursEffectiveFrom(
      timezone,
      hours,
      await this.prisma.appointment.findMany({
        where: {
          barbershopId,
          status: {
            in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED],
          },
          startsAt: {
            gte: DateTime.now()
              .setZone(timezone)
              .startOf('day')
              .plus({ days: 1 })
              .toUTC()
              .toJSDate(),
          },
        },
        select: { startsAt: true, endsAt: true },
      }),
    );
  }

  private async safeMemberHoursEffectiveFrom(
    memberId: string,
    timezone: string,
    hours: EffectiveWorkingHours[],
  ) {
    return this.safeHoursEffectiveFrom(
      timezone,
      hours,
      await this.prisma.appointment.findMany({
        where: {
          businessMemberId: memberId,
          status: {
            in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED],
          },
          startsAt: {
            gte: DateTime.now()
              .setZone(timezone)
              .startOf('day')
              .plus({ days: 1 })
              .toUTC()
              .toJSDate(),
          },
        },
        select: { startsAt: true, endsAt: true },
      }),
    );
  }

  private safeHoursEffectiveFrom(
    timezone: string,
    hours: EffectiveWorkingHours[],
    appointments: Array<{ startsAt: Date; endsAt: Date }>,
  ) {
    let effectiveFrom = DateTime.now()
      .setZone(timezone)
      .startOf('day')
      .plus({ days: 1 });
    const hoursByWeekday = new Map(hours.map((hour) => [hour.weekday, hour]));

    for (const appointment of appointments) {
      const startsAt = DateTime.fromJSDate(appointment.startsAt).setZone(
        timezone,
      );
      const endsAt = DateTime.fromJSDate(appointment.endsAt).setZone(timezone);
      const hoursForDay = hoursByWeekday.get(
        orderedWeekdays[startsAt.weekday - 1],
      );
      const fitsNewHours =
        hoursForDay &&
        startsAt.toFormat('yyyy-MM-dd') === endsAt.toFormat('yyyy-MM-dd') &&
        this.toMinutes(startsAt.toFormat('HH:mm')) >=
          this.toMinutes(hoursForDay.startTime) &&
        this.toMinutes(endsAt.toFormat('HH:mm')) <=
          this.toMinutes(hoursForDay.endTime);

      if (!fitsNewHours) {
        const afterAppointment = endsAt.startOf('day').plus({ days: 1 });
        if (afterAppointment > effectiveFrom) effectiveFrom = afterAppointment;
      }
    }
    return effectiveFrom;
  }

  async findUpcomingScheduleBlocks(barbershopId: string, memberId: string) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    return this.prisma.memberScheduleBlock.findMany({
      where: {
        businessMemberId: memberId,
        endsAt: { gte: new Date() },
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async createMemberScheduleBlock(
    barbershopId: string,
    memberId: string,
    dto: CreateMemberScheduleBlockDto,
  ) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException(
        'Blok bitişi başlangıç zamanından sonra olmalı.',
      );
    }

    if (endsAt <= new Date()) {
      throw new BadRequestException(
        'Geçmiş zaman için mola veya izin eklenemez.',
      );
    }

    const [conflictingAppointment, conflictingBlock] = await Promise.all([
      this.prisma.appointment.findFirst({
        where: {
          businessMemberId: memberId,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          status: {
            in: [AppointmentStatus.CONFIRMED, AppointmentStatus.ARRIVED],
          },
        },
        select: { id: true },
      }),
      this.prisma.memberScheduleBlock.findFirst({
        where: {
          businessMemberId: memberId,
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
        },
        select: { id: true },
      }),
    ]);

    if (conflictingAppointment) {
      throw new ConflictException(
        'Bu zaman aralığında çalışanın onaylı randevusu var.',
      );
    }

    if (conflictingBlock) {
      throw new ConflictException(
        'Bu zaman aralığında çalışanın başka bir mola veya izni var.',
      );
    }

    return this.prisma.memberScheduleBlock.create({
      data: {
        businessMemberId: memberId,
        type: dto.type,
        startsAt,
        endsAt,
        note: dto.note?.trim(),
      },
    });
  }

  async removeMemberScheduleBlock(
    barbershopId: string,
    memberId: string,
    blockId: string,
  ) {
    await this.ensureMemberBelongsToBarbershop(barbershopId, memberId);

    const deleted = await this.prisma.memberScheduleBlock.deleteMany({
      where: { id: blockId, businessMemberId: memberId },
    });

    if (deleted.count === 0) {
      throw new NotFoundException('Mola veya izin bloğu bulunamadı.');
    }

    return { success: true };
  }

  private validateWorkingHours(hours: WorkingHoursItemDto[]) {
    const weekdays = new Set(hours.map((hour) => hour.weekday));

    if (weekdays.size !== hours.length) {
      throw new BadRequestException('Bir gün yalnız bir kez tanımlanabilir.');
    }

    for (const hour of hours) {
      if (this.toMinutes(hour.startTime) >= this.toMinutes(hour.endTime)) {
        throw new BadRequestException(
          'Bitiş saati başlangıç saatinden sonra olmalı.',
        );
      }
    }
  }

  private async validateMemberHoursAgainstBusinessHours(
    barbershopId: string,
    hours: WorkingHoursItemDto[],
  ) {
    const businessHours = await this.prisma.workingHours.findMany({
      where: {
        barbershopId,
        weekday: { in: hours.map((hour) => hour.weekday) },
      },
      select: { weekday: true, startTime: true, endTime: true },
    });
    const businessHoursByWeekday = new Map(
      businessHours.map((hour) => [hour.weekday, hour]),
    );

    for (const hour of hours) {
      const businessDay = businessHoursByWeekday.get(hour.weekday);

      if (!businessDay) {
        throw new BadRequestException(
          'İşletmenin kapalı olduğu güne çalışan vardiyası eklenemez.',
        );
      }

      if (
        this.toMinutes(hour.startTime) <
          this.toMinutes(businessDay.startTime) ||
        this.toMinutes(hour.endTime) > this.toMinutes(businessDay.endTime)
      ) {
        throw new BadRequestException(
          'Çalışan vardiyası işletmenin açık saatleri içinde olmalı.',
        );
      }
    }
  }

  private toMinutes(time: string) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async ensureMemberBelongsToBarbershop(
    barbershopId: string,
    memberId: string,
  ) {
    const member = await this.prisma.businessMember.findFirst({
      where: { id: memberId, barbershopId },
      select: { id: true },
    });

    if (!member) {
      throw new BadRequestException('Çalışan bu işletmeye ait değil.');
    }
  }
}
