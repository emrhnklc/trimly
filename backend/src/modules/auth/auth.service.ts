import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { EmailService } from '../../common/email/email.service';
import { normalizeTurkishPhone } from '../../common/phone/normalize-turkish-phone';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendEmailVerificationDto } from './dto/resend-email-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { UsersService } from '../users/users.service';

const emailVerificationLifetimeMinutes = 10;
const emailVerificationResendCooldownSeconds = 60;
const emailVerificationMaximumAttempts = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const phone = dto.phone?.trim()
      ? normalizeTurkishPhone(dto.phone)
      : undefined;
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta ile kayıtlı bir kullanıcı var.');
    }

    if (phone) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phone },
        select: { id: true },
      });

      if (existingPhone) {
        throw new ConflictException(
          'Bu telefon numarası başka bir hesapta kayıtlı.',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          phone,
        },
      });

      return this.issueEmailVerificationChallenge(user.id, user.email);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Bu e-posta veya telefon numarası başka bir hesapta kayıtlı.',
        );
      }

      throw error;
    }
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Devam etmek için e-posta adresini doğrulamalısın.',
      });
    }

    return this.createAuthResponse(user);
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { email: true, emailVerifiedAt: true, id: true },
    });

    if (!user) this.throwInvalidVerificationCode();
    if (user.emailVerifiedAt) return this.createAuthResponse(user);

    const challenge = await this.prisma.emailVerificationChallenge.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge || challenge.expiresAt <= new Date()) {
      throw new BadRequestException({
        code: 'EMAIL_VERIFICATION_EXPIRED',
        message: 'Doğrulama kodunun süresi dolmuş. Yeni bir kod iste.',
      });
    }

    if (challenge.attempts >= emailVerificationMaximumAttempts) {
      this.throwVerificationAttemptLimit();
    }

    const isValid = this.matchesVerificationCode(
      user.id,
      dto.code,
      challenge.codeHash,
    );
    if (!isValid) {
      const updated = await this.prisma.emailVerificationChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
        select: { attempts: true },
      });

      if (updated.attempts >= emailVerificationMaximumAttempts) {
        this.throwVerificationAttemptLimit();
      }

      throw new BadRequestException({
        code: 'EMAIL_VERIFICATION_CODE_INVALID',
        message: `Kod hatalı. ${emailVerificationMaximumAttempts - updated.attempts} deneme hakkın kaldı.`,
      });
    }

    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.emailVerificationChallenge.updateMany({
        where: {
          expiresAt: { gt: now },
          id: challenge.id,
          usedAt: null,
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        throw new ConflictException({
          code: 'EMAIL_VERIFICATION_ALREADY_USED',
          message: 'Bu doğrulama kodu daha önce kullanılmış.',
        });
      }

      await transaction.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: now },
      });
    });

    return this.createAuthResponse(user);
  }

  async resendEmailVerification(dto: ResendEmailVerificationDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { email: true, emailVerifiedAt: true, id: true },
    });

    if (!user || user.emailVerifiedAt) {
      return {
        message: 'Hesap uygunsa yeni doğrulama kodu gönderildi.',
      };
    }

    const latestChallenge =
      await this.prisma.emailVerificationChallenge.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

    if (latestChallenge) {
      const retryAt = new Date(
        latestChallenge.createdAt.getTime() +
          emailVerificationResendCooldownSeconds * 1000,
      );

      if (retryAt > new Date()) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((retryAt.getTime() - Date.now()) / 1000),
        );
        throw new HttpException(
          {
            code: 'EMAIL_VERIFICATION_RATE_LIMITED',
            message: `Yeni kod için ${retryAfterSeconds} saniye beklemelisin.`,
            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    return this.issueEmailVerificationChallenge(user.id, user.email);
  }

  findMe(userId: string) {
    return this.usersService.findMe(userId);
  }

  private async issueEmailVerificationChallenge(userId: string, email: string) {
    const code = randomInt(100000, 1000000).toString();
    const codeHash = this.hashVerificationCode(userId, code);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + emailVerificationLifetimeMinutes * 60 * 1000,
    );

    await this.prisma.$transaction([
      this.prisma.emailVerificationChallenge.updateMany({
        where: { userId, usedAt: null },
        data: { usedAt: now },
      }),
      this.prisma.emailVerificationChallenge.create({
        data: { codeHash, expiresAt, userId },
      }),
    ]);

    await this.emailService.sendEmailVerificationCode(email, code);

    return {
      email,
      expiresAt,
      verificationRequired: true as const,
      ...(this.emailService.usesDevelopmentPreview
        ? { devVerificationCode: code }
        : {}),
    };
  }

  private throwInvalidVerificationCode(): never {
    throw new BadRequestException({
      code: 'EMAIL_VERIFICATION_CODE_INVALID',
      message: 'Doğrulama kodu hatalı.',
    });
  }

  private hashVerificationCode(userId: string, code: string) {
    const secret =
      process.env.EMAIL_VERIFICATION_SECRET ?? process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        'EMAIL_VERIFICATION_SECRET or JWT_SECRET must be configured.',
      );
    }

    return createHmac('sha256', secret)
      .update(`${userId}:${code}`)
      .digest('hex');
  }

  private matchesVerificationCode(
    userId: string,
    code: string,
    storedHash: string,
  ) {
    const expected = Buffer.from(storedHash, 'hex');
    const received = Buffer.from(
      this.hashVerificationCode(userId, code),
      'hex',
    );

    return (
      expected.length === received.length && timingSafeEqual(expected, received)
    );
  }

  private throwVerificationAttemptLimit(): never {
    throw new HttpException(
      {
        code: 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED',
        message: 'Kod deneme sınırına ulaştın. Yeni bir kod iste.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }

  private async createAuthResponse(user: { id: string; email: string }) {
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    const publicUser = await this.usersService.findMe(user.id);

    return {
      accessToken,
      user: publicUser,
    };
  }
}
