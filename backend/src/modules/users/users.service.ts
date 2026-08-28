import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
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
} satisfies Prisma.UserSelect;

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

    return user;
  }

  async updateMe(userId: string, dto: UpdateMyProfileDto) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && {
            firstName: dto.firstName?.trim(),
          }),
          ...(dto.lastName !== undefined && {
            lastName: dto.lastName?.trim(),
          }),
          ...(dto.phone !== undefined && {
            phone: dto.phone?.trim() || null,
          }),
          ...(dto.profileImageUrl !== undefined && {
            profileImageUrl: dto.profileImageUrl?.trim() || null,
          }),
        },
        select: publicUserSelect,
      });
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
