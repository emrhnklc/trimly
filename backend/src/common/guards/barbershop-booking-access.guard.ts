import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { BarbershopAccessMode } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedUser } from '../../modules/auth/strategies/jwt.strategy';

type RequestWithBarbershopAccessContext = {
  user?: AuthenticatedUser;
  params: { barbershopId?: string };
};

@Injectable()
export class BarbershopBookingAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithBarbershopAccessContext>();
    const userId = request.user?.id;
    const barbershopId = request.params.barbershopId;

    if (!userId || !barbershopId) {
      throw new UnauthorizedException('İşletme erişimi doğrulanamadı.');
    }

    const barbershop = await this.prisma.barbershop.findUnique({
      where: { id: barbershopId },
      select: {
        accessMode: true,
        members: {
          where: { userId, isActive: true },
          take: 1,
          select: { id: true },
        },
        customerAccesses: {
          where: { userId, revokedAt: null },
          take: 1,
          select: { userId: true },
        },
      },
    });

    if (!barbershop) {
      throw new NotFoundException('İşletme bulunamadı.');
    }

    if (
      barbershop.accessMode === BarbershopAccessMode.PUBLIC ||
      barbershop.members.length > 0 ||
      barbershop.customerAccesses.length > 0
    ) {
      return true;
    }

    throw new ForbiddenException({
      statusCode: 403,
      code: 'BARBERSHOP_ACCESS_REQUIRED',
      message: 'Bu işletmeden randevu alabilmek için erişim kodu gereklidir.',
    });
  }
}
