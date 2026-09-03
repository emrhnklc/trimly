import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { normalizeTurkishPhone } from '../../common/phone/normalize-turkish-phone';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

const publicUserSelect = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  createdAt: true,
  updatedAt: true,
  memberships: {
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      role: true,
      isActive: true,
      isBookable: true,
      barbershop: {
        select: {
          id: true,
          name: true,
          slug: true,
          profileImageUrl: true,
          timezone: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type PublicUserRecord = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

function presentPublicUser(user: PublicUserRecord) {
  const { memberships, ...profile } = user;
  return { ...profile, businessMemberships: memberships };
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    return presentPublicUser(user);
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && {
            firstName: dto.firstName?.trim(),
          }),
          ...(dto.lastName !== undefined && {
            lastName: dto.lastName?.trim(),
          }),
          ...(dto.phone !== undefined && {
            phone: dto.phone.trim() ? normalizeTurkishPhone(dto.phone) : null,
          }),
          ...(dto.profileImageUrl !== undefined && {
            profileImageUrl: dto.profileImageUrl?.trim() || null,
          }),
        },
        select: publicUserSelect,
      });

      return presentPublicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Bu telefon numarası başka bir kullanıcıda kayıtlı.',
        );
      }

      throw error;
    }
  }
}
