import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTime } from 'luxon';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Appointment penalties and appeals (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let barbershopId: string | undefined;
  let secondBarbershopId: string | undefined;
  let memberId: string;
  let serviceId: string;
  let ownerToken: string;
  let customerToken: string;
  let moderatorToken: string;
  let customerId: string;
  const ownerEmail = `penalty-owner-${randomUUID()}@trimly.test`;
  const customerEmail = `penalty-customer-${randomUUID()}@trimly.test`;
  const moderatorEmail = `penalty-moderator-${randomUUID()}@trimly.test`;
  const password = 'Very-safe-test-password1';

  async function register(email: string) {
    const registration = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, firstName: 'Penalty', lastName: 'Test' })
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

  function localDate(startsAt: Date) {
    const date = DateTime.fromJSDate(startsAt)
      .setZone('Europe/Istanbul')
      .toISODate();
    return new Date(`${date}T00:00:00.000Z`);
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

    const owner = await register(ownerEmail);
    const customer = await register(customerEmail);
    const moderator = await register(moderatorEmail);
    ownerToken = owner.accessToken;
    customerToken = customer.accessToken;
    moderatorToken = moderator.accessToken;
    customerId = customer.user.id;
    await prisma.user.update({
      where: { id: moderator.user.id },
      data: { isPlatformModerator: true },
    });

    const created = await request(app.getHttpServer())
      .post('/barbershops')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Penalty E2E Barber', slug: `penalty-${randomUUID()}` })
      .expect(201);
    const shop = created.body as {
      id: string;
      members: { id: string }[];
    };
    barbershopId = shop.id;
    memberId = shop.members[0].id;
    const secondShop = await request(app.getHttpServer())
      .post('/barbershops')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Penalty E2E Second Barber',
        slug: `penalty-second-${randomUUID()}`,
      })
      .expect(201);
    secondBarbershopId = (secondShop.body as { id: string }).id;
    const service = await prisma.service.create({
      data: {
        barbershopId,
        name: 'Penalty Test Kesim',
        durationMinutes: 10,
        price: '300',
      },
    });
    serviceId = service.id;
  });

  it('applies business thresholds and lifts only the no-longer-earned suspension after appeal', async () => {
    const dependents = await Promise.all(
      [1, 2, 3, 4].map((number) =>
        prisma.dependentProfile.create({
          data: {
            ownerId: customerId,
            firstName: `Attendee${number}`,
            lastName: 'Test',
            relationship: 'SIBLING',
            birthDate: new Date('2000-01-01T00:00:00.000Z'),
          },
        }),
      ),
    );
    const eventIds: string[] = [];

    for (const [index, dependent] of dependents.entries()) {
      // Four non-overlapping starts, each 2–6 hours away: 2 points each.
      const startsAt = new Date(Date.now() + (180 + index * 15) * 60_000);
      const appointment = await prisma.appointment.create({
        data: {
          barbershopId: barbershopId!,
          businessMemberId: memberId,
          customerId,
          dependentProfileId: dependent.id,
          attendeeNameSnapshot: `${dependent.firstName} ${dependent.lastName}`,
          appointmentLocalDate: localDate(startsAt),
          serviceId,
          serviceNameSnapshot: 'Penalty Test Kesim',
          originalPriceSnapshot: '300',
          priceSnapshot: '300',
          durationMinutes: 10,
          startsAt,
          endsAt: new Date(startsAt.getTime() + 10 * 60_000),
        },
      });
      const cancellation = await request(app.getHttpServer())
        .patch(
          `/barbershops/${barbershopId}/appointments/${appointment.id}/cancel`,
        )
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ reason: 'Çalışan programı beklenmedik şekilde değişti' })
        .expect(200);
      expect(cancellation.body).toMatchObject({
        status: 'CANCELLED',
        reliabilityImpact: {
          pointsAwarded: 2,
          pointReason: 'BETWEEN_2_AND_6_HOURS',
          totalPoints90Days: (index + 1) * 2,
        },
      });
      const event = await prisma.businessCancellationEvent.findUniqueOrThrow({
        where: { appointmentId: appointment.id },
      });
      expect(event.points).toBe(2);
      eventIds.push(event.id);
    }

    const status = await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/appointments/reliability`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(status.body).toMatchObject({ points90Days: 8 });
    expect(status.body.recentCancellations[0]).toMatchObject({
      pointReason: 'BETWEEN_2_AND_6_HOURS',
      appointment: {
        serviceNameSnapshot: 'Penalty Test Kesim',
      },
      businessMember: {
        user: { firstName: 'Penalty', lastName: 'Test' },
      },
    });
    const actionTypes = (
      status.body as { actions: { type: string }[] }
    ).actions.map((action) => action.type);
    expect(actionTypes).toEqual(
      expect.arrayContaining([
        'WARNING',
        'MEMBER_REVIEW_HOLD',
        'BOOKING_SUSPENSION',
      ]),
    );
    await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/appointments/reliability`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);

    const eventId = eventIds[3];
    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/reliability/cancellations/${eventId}/appeal`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'İptal nedeni doğrulanmış bir sistem hatasıydı.' })
      .expect(200);
    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/reliability/cancellations/${eventId}/appeal`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'Aynı itiraz ikinci defa gönderilemez.' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/moderation/business-cancellation-appeals/${eventId}/review`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        approved: true,
        note: 'Sistem hatası doğrulandı ve kayıt muaf tutuldu.',
        exemptionReason: 'VERIFIED_ERROR',
      })
      .expect(403);
    const review = await request(app.getHttpServer())
      .patch(`/moderation/business-cancellation-appeals/${eventId}/review`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({
        approved: true,
        note: 'Sistem hatası doğrulandı ve kayıt muaf tutuldu.',
        exemptionReason: 'VERIFIED_ERROR',
      })
      .expect(200);
    expect(review.body).toMatchObject({ success: true });

    const afterAppeal = await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/appointments/reliability`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    expect(afterAppeal.body).toMatchObject({ points90Days: 6 });
    const activeTypes = (
      afterAppeal.body as { actions: { type: string }[] }
    ).actions.map((action) => action.type);
    expect(activeTypes).not.toContain('BOOKING_SUSPENSION');
    expect(activeTypes).toContain('MEMBER_REVIEW_HOLD');
  });

  it('keeps no-show provisional during dispute and revokes it after moderator approval', async () => {
    const startsAt = new Date(Date.now() - 30 * 60_000);
    const appointment = await prisma.appointment.create({
      data: {
        barbershopId: barbershopId!,
        businessMemberId: memberId,
        customerId,
        attendeeNameSnapshot: 'Penalty Test',
        appointmentLocalDate: localDate(startsAt),
        serviceId,
        serviceNameSnapshot: 'Penalty Test Kesim',
        originalPriceSnapshot: '300',
        priceSnapshot: '300',
        durationMinutes: 40,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 40 * 60_000),
      },
    });
    const marked = await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/${appointment.id}/no-show`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const caseId = (marked.body as { id: string }).id;
    expect(marked.body).toMatchObject({ status: 'PENDING_DISPUTE' });

    const beforeReview = await request(app.getHttpServer())
      .get('/appointments/no-show/status')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(beforeReview.body).toMatchObject({
      confirmedCount: 0,
      pendingCount: 1,
      activeRestrictions: [],
    });
    await request(app.getHttpServer())
      .patch(`/appointments/${appointment.id}/no-show/dispute`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ reason: 'Müşteri randevuya zamanında geldi.' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/appointments/${appointment.id}/no-show/dispute`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Randevuya zamanında geldim, kayıt hatalıdır.' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/moderation/no-show-cases/${caseId}/review`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ accepted: true, note: 'Giriş kaydı incelendi, itiraz haklı.' })
      .expect(403);
    const reviewed = await request(app.getHttpServer())
      .patch(`/moderation/no-show-cases/${caseId}/review`)
      .set('Authorization', `Bearer ${moderatorToken}`)
      .send({ accepted: true, note: 'Giriş kaydı incelendi, itiraz haklı.' })
      .expect(200);
    expect(reviewed.body).toMatchObject({ status: 'REVOKED' });
    const stored = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
      include: { noShowCase: true },
    });
    expect(stored.status).toBe('CANCELLED');
    expect(stored.noShowCase?.status).toBe('REVOKED');

    const afterReview = await request(app.getHttpServer())
      .get('/appointments/no-show/status')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);
    expect(afterReview.body).toMatchObject({
      confirmedCount: 0,
      pendingCount: 0,
      underReviewCount: 0,
      activeRestrictions: [],
    });
  });

  it('applies 7-day and 30-day platform restrictions only after the third and sixth confirmed no-shows', async () => {
    const dependents = await Promise.all(
      [1, 2, 3, 4, 5, 6, 7].map((number) =>
        prisma.dependentProfile.create({
          data: {
            ownerId: customerId,
            firstName: `NoShow${number}`,
            lastName: 'Test',
            relationship: 'SIBLING',
            birthDate: new Date('2000-01-01T00:00:00.000Z'),
          },
        }),
      ),
    );
    const futureStart = new Date(Date.now() + 24 * 60 * 60_000);
    const existingBooking = await prisma.appointment.create({
      data: {
        barbershopId: barbershopId!,
        businessMemberId: memberId,
        customerId,
        attendeeNameSnapshot: 'Penalty Test',
        appointmentLocalDate: localDate(futureStart),
        serviceId,
        serviceNameSnapshot: 'Penalty Test Kesim',
        originalPriceSnapshot: '300',
        priceSnapshot: '300',
        durationMinutes: 10,
        startsAt: futureStart,
        endsAt: new Date(futureStart.getTime() + 10 * 60_000),
      },
    });

    // All visits existed before any penalty; later penalties must not delete them.
    const pastAppointments = await Promise.all(
      dependents.map((dependent, index) => {
        const startsAt = new Date(Date.now() - (59 - index * 7) * 60_000);
        return prisma.appointment.create({
          data: {
            barbershopId: barbershopId!,
            businessMemberId: memberId,
            customerId,
            dependentProfileId: dependent.id,
            attendeeNameSnapshot: `${dependent.firstName} ${dependent.lastName}`,
            appointmentLocalDate: localDate(startsAt),
            serviceId,
            serviceNameSnapshot: 'Penalty Test Kesim',
            originalPriceSnapshot: '300',
            priceSnapshot: '300',
            durationMinutes: 5,
            startsAt,
            endsAt: new Date(startsAt.getTime() + 5 * 60_000),
          },
        });
      }),
    );

    for (const [index, appointment] of pastAppointments.entries()) {
      const marked = await request(app.getHttpServer())
        .patch(
          `/barbershops/${barbershopId}/appointments/${appointment.id}/no-show`,
        )
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      const caseId = (marked.body as { id: string }).id;
      await request(app.getHttpServer())
        .patch(`/appointments/${appointment.id}/no-show/dispute`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ reason: 'Gelmedi kaydına itiraz ediyorum; lütfen inceleyin.' })
        .expect(200);
      const accepted = index === 5;
      await request(app.getHttpServer())
        .patch(`/moderation/no-show-cases/${caseId}/review`)
        .set('Authorization', `Bearer ${moderatorToken}`)
        .send({
          accepted,
          note: accepted
            ? 'İtiraz haklı; giriş kaydı doğrulandı.'
            : 'Giriş kayıtlarında müşteri bulunamadı.',
        })
        .expect(200);

      const status = await request(app.getHttpServer())
        .get('/appointments/no-show/status')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);
      expect(status.body).toMatchObject({
        confirmedCount: index === 5 ? 5 : index === 6 ? 6 : index + 1,
      });
      const restrictions = (
        status.body as {
          activeRestrictions: { scope: string; expiresAt: string }[];
        }
      ).activeRestrictions;
      if (index === 0) expect(restrictions).toEqual([]);
      if (index === 1) {
        expect(restrictions).toEqual([
          expect.objectContaining({ scope: 'BARBERSHOP' }),
        ]);
        const remainingDays =
          (new Date(restrictions[0].expiresAt).getTime() - Date.now()) /
          86_400_000;
        expect(remainingDays).toBeGreaterThan(13);
        expect(remainingDays).toBeLessThanOrEqual(14);
      }
      if (index === 2) {
        expect(restrictions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ scope: 'BARBERSHOP' }),
            expect.objectContaining({ scope: 'PLATFORM' }),
          ]),
        );
        expect(
          restrictions.filter((item) => item.scope === 'PLATFORM'),
        ).toHaveLength(1);
        const platformRestriction = restrictions.find(
          (item) => item.scope === 'PLATFORM',
        )!;
        const remainingDays =
          (new Date(platformRestriction.expiresAt).getTime() - Date.now()) /
          86_400_000;
        expect(remainingDays).toBeGreaterThan(6);
        expect(remainingDays).toBeLessThanOrEqual(7);
        expect(
          restrictions.some(
            (item) =>
              item.scope === 'BARBERSHOP' &&
              (new Date(item.expiresAt).getTime() - Date.now()) / 86_400_000 >
                29,
          ),
        ).toBe(true);
      }
      if (index === 5) {
        expect(
          restrictions.filter((item) => item.scope === 'PLATFORM'),
        ).toHaveLength(1);
      }
      if (index === 6) {
        const platformRestrictions = restrictions.filter(
          (item) => item.scope === 'PLATFORM',
        );
        expect(platformRestrictions).toHaveLength(2);
        const longestRemainingDays = Math.max(
          ...platformRestrictions.map(
            (item) =>
              (new Date(item.expiresAt).getTime() - Date.now()) / 86_400_000,
          ),
        );
        expect(longestRemainingDays).toBeGreaterThan(29);
        expect(longestRemainingDays).toBeLessThanOrEqual(30);
      }
    }

    const existing = await prisma.appointment.findUniqueOrThrow({
      where: { id: existingBooking.id },
    });
    expect(existing.status).toBe('CONFIRMED');
    const nextStart = new Date(Date.now() + 48 * 60 * 60_000);
    const denied = await request(app.getHttpServer())
      .post(`/barbershops/${barbershopId}/appointments`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        memberId,
        serviceId,
        startsAt: nextStart.toISOString(),
      })
      .expect(403);
    expect((denied.body as { message: string }).message).toContain(
      'yeni randevu alamazsın',
    );
    const deniedAtOtherShop = await request(app.getHttpServer())
      .post(`/barbershops/${secondBarbershopId}/appointments`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        memberId,
        serviceId,
        startsAt: nextStart.toISOString(),
      })
      .expect(403);
    expect((deniedAtOtherShop.body as { message: string }).message).toContain(
      'Gelmedi kayıtları nedeniyle',
    );
  });

  afterAll(async () => {
    if (barbershopId) {
      await prisma.appointment.deleteMany({ where: { barbershopId } });
      await prisma.service.deleteMany({ where: { barbershopId } });
      await prisma.businessMember.deleteMany({ where: { barbershopId } });
      await prisma.bookingSettings.deleteMany({ where: { barbershopId } });
      await prisma.barbershop.deleteMany({ where: { id: barbershopId } });
    }
    if (secondBarbershopId) {
      await prisma.businessMember.deleteMany({
        where: { barbershopId: secondBarbershopId },
      });
      await prisma.bookingSettings.deleteMany({
        where: { barbershopId: secondBarbershopId },
      });
      await prisma.barbershop.deleteMany({
        where: { id: secondBarbershopId },
      });
    }
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, customerEmail, moderatorEmail] } },
    });
    await app.close();
  });
});
