import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(barbershopId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        barbershopId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        durationMinutes: dto.durationMinutes,
        price: dto.price,
      },
    });
  }

  findActiveByBarbershop(barbershopId: string) {
    return this.prisma.service.findMany({
      where: {
        barbershopId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        price: true,
      },
    });
  }

  findAllForManagement(barbershopId: string) {
    return this.prisma.service.findMany({
      where: { barbershopId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(barbershopId: string, serviceId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, barbershopId },
      select: { id: true },
    });

    if (!service) {
      throw new NotFoundException('Hizmet bu işletmeye ait değil.');
    }

    return this.prisma.service.update({
      where: { id: service.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.description !== undefined && {
          description: dto.description.trim(),
        }),
        ...(dto.durationMinutes !== undefined && {
          durationMinutes: dto.durationMinutes,
        }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }
}
