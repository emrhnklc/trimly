import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

const weekdays = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

describe('Business cancellation recovery (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let barbershopId: string | undefined;
  const ownerEmail = `recovery-owner-${randomUUID()}@trimly.test`;
  const customerEmail = `recovery-customer-${randomUUID()}@trimly.test`;
  const password = 'Very-safe-test-password1';

  async function register(email: string) {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, firstName: 'Recovery', lastName: 'Test' })
      .expect(201);
    const pending = registration.body as {
      email: string;
      devVerificationCode: string;
    };
    const verified = await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ email: pending.email, code: pending.devVerificationCode })
      .expect(201);
    return verified.body as {
      accessToken: string;
      user: { id: string };
    };
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    prisma = app.get(PrismaService);
    await app.init();
  });

  it('offers a cancelled customer available times without exposing them to another user', async () => {
    const owner = await register(ownerEmail);
    const customer = await register(customerEmail);
    const created = await request(app.getHttpServer())
      .post('/barbershops')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Recovery E2E Barber', slug: `recovery-${randomUUID()}` })
      .expect(201);
    const shop = created.body as {
      id: string;
      members: { id: string }[];
    };
    barbershopId = shop.id;
    const memberId = shop.members[0].id;

    const service = await prisma.service.create({
      data: {
        barbershopId,
        name: 'Recovery Kesim',
        durationMinutes: 30,
        price: '300',
      },
    });
    await prisma.businessMemberService.create({
      data: { businessMemberId: memberId, serviceId: service.id },
    });
    await prisma.businessMember.update({
      where: { id: memberId },
      data: { isBookable: true },
    });
    await prisma.workingHours.createMany({
      data: weekdays.map((weekday) => ({
        barbershopId: shop.id,
        weekday,
        startTime: '09:00',
        endTime: '19:00',
      })),
    });
    await prisma.memberWorkingHours.createMany({
      data: weekdays.map((weekday) => ({
        businessMemberId: memberId,
        weekday,
        startTime: '09:00',
        endTime: '19:00',
      })),
    });
    await prisma.barbershopPhoto.createMany({
      data: [0, 1].map((sortOrder) => ({
        barbershopId: shop.id,
        storageKey: `recovery-e2e-${randomUUID()}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 1,
        sortOrder,
      })),
    });
    await prisma.barbershop.update({
      where: { id: shop.id },
      data: {
        phone: '+905551112233',
        latitude: 38.43,
        longitude: 27.14,
        profileImageUrl: 'https://trimly.test/profile.jpg',
        coverImageUrl: 'https://trimly.test/cover.jpg',
        isDiscoverable: true,
        acceptsBookings: true,
      },
    });

    const date = DateTime.now()
      .setZone('Europe/Istanbul')
      .plus({ days: 1 })
      .toISODate()!;
    const availability = await request(app.getHttpServer())
      .get(`/barbershops/${shop.id}/availability`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .query({ date, memberId, serviceId: service.id })
      .expect(200);
    const slots = (
      availability.body as {
        slots: { startsAt: string }[];
      }
    ).slots;
    expect(slots.length).toBeGreaterThan(0);

    const booking = await request(app.getHttpServer())
      .post(`/barbershops/${shop.id}/appointments`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ memberId, serviceId: service.id, startsAt: slots[0].startsAt })
      .expect(201);
    const appointmentId = (booking.body as { id: string }).id;

    await request(app.getHttpServer())
      .patch(`/barbershops/${shop.id}/appointments/${appointmentId}/cancel`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ reason: 'Çalışan programı değişti' })
      .expect(200);
    expect(
      await prisma.businessCancellationEvent.count({
        where: { appointmentId },
      }),
    ).toBe(1);

    const recovery = await request(app.getHttpServer())
      .get(`/appointments/${appointmentId}/recovery-options`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);
    expect(recovery.body).toMatchObject({
      serviceId: service.id,
      bookingOpen: true,
      shop: { id: shop.id },
    });
    const recoveryOptions = (
      recovery.body as {
        options: { memberId: string; startsAt: string }[];
      }
    ).options;
    expect(recoveryOptions.length).toBeGreaterThan(0);

    const rebooking = await request(app.getHttpServer())
      .post(`/barbershops/${shop.id}/appointments`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({
        memberId: recoveryOptions[0].memberId,
        serviceId: service.id,
        startsAt: recoveryOptions[0].startsAt,
      })
      .expect(201);
    expect((rebooking.body as { id: string }).id).not.toBe(appointmentId);

    await request(app.getHttpServer())
      .get(`/appointments/${appointmentId}/recovery-options`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(404);

    await prisma.barbershop.update({
      where: { id: shop.id },
      data: { acceptsBookings: false },
    });
    const closedRecovery = await request(app.getHttpServer())
      .get(`/appointments/${appointmentId}/recovery-options`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);
    expect(closedRecovery.body).toMatchObject({
      bookingOpen: false,
      options: [],
    });
  });

  afterAll(async () => {
    if (barbershopId) {
      await prisma.appointment.deleteMany({ where: { barbershopId } });
      await prisma.service.deleteMany({ where: { barbershopId } });
      await prisma.workingHours.deleteMany({ where: { barbershopId } });
      await prisma.businessMember.deleteMany({ where: { barbershopId } });
      await prisma.bookingSettings.deleteMany({ where: { barbershopId } });
      await prisma.barbershop.deleteMany({ where: { id: barbershopId } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, customerEmail] } },
    });
    await app.close();
  });
});
