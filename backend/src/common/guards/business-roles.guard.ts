import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BusinessRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { BUSINESS_ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../../modules/auth/strategies/jwt.strategy';

type RequestWithBusinessContext = {
  user?: AuthenticatedUser;
  params: { barbershopId?: string };
};

@Injectable()
export class BusinessRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const allowedRoles = this.reflector.getAllAndOverride<BusinessRole[]>(
      BUSINESS_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!allowedRoles) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithBusinessContext>();
    const userId = request.user?.id;
    const barbershopId = request.params.barbershopId;

    if (!userId || !barbershopId) {
      throw new UnauthorizedException('İşletme yetkisi doğrulanamadı.');
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: {
        userId_barbershopId: { userId, barbershopId },
      },
    });

    return Boolean(
      membership?.isActive && allowedRoles.includes(membership.role),
    );
  }
}
