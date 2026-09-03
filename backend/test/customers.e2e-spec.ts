import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DateTime } from 'luxon';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { AppModule } from '../src/app.module';
import { NotificationsService } from '../src/modules/notifications/notifications.service';

type RegisterResponse = {
  accessToken: string;
  user: { id: string };
};

type VerificationPendingResponse = {
  email: string;
  devVerificationCode: string;
};

type CreatedBarbershop = {
  id: string;
  members: { id: string }[];
};

type BusinessCustomerResponse = {
  id: string;
  totalAppointmentCount: number;
  completedVisitCount: number;
  lastVisitAt: string | null;
  nextAppointmentAt: string | null;
};

type BusinessCustomerDetailResponse = BusinessCustomerResponse & {
  appointments: {
    id: string;
    status: string;
    haircutRecord: { styleName: string | null; notes: string | null } | null;
  }[];
};

async function verifyRegistration(app: INestApplication<App>, body: unknown) {
  const pending = body as VerificationPendingResponse;
  const response = await request(app.getHttpServer())
    .post('/auth/verify-email')
    .send({ email: pending.email, code: pending.devVerificationCode })
    .expect(201);

  return response.body as RegisterResponse;
}

describe('Business customers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let barbershopId: string;
  let uploadedPhotoStorageKey: string | undefined;
  const ownerEmail = `customer-owner-${randomUUID()}@trimly.test`;
  const customerEmail = `customer-${randomUUID()}@trimly.test`;
  const password = 'Very-safe-test-password1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

  it('returns appointment statistics only to an authorized business owner', async () => {
    const ownerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: ownerEmail,
        password,
        firstName: 'Owner',
        lastName: 'Test',
      })
      .expect(201);
    const owner = await verifyRegistration(app, ownerResponse.body);

    const customerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: customerEmail,
        password,
        firstName: 'Customer',
        lastName: 'Test',
      })
      .expect(201);
    const customer = await verifyRegistration(app, customerResponse.body);

    const barbershopResponse = await request(app.getHttpServer())
      .post('/barbershops')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        name: 'Customer E2E Barber',
        slug: `customer-e2e-${randomUUID()}`,
      })
      .expect(201);
    const barbershop = barbershopResponse.body as CreatedBarbershop;
    barbershopId = barbershop.id;

    const service = await prisma.service.create({
      data: {
        barbershopId,
        name: 'Test Kesim',
        durationMinutes: 30,
        price: '450',
      },
    });
    const completedStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const upcomingStart = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.appointment.createMany({
      data: [
        {
          barbershopId,
          businessMemberId: barbershop.members[0].id,
          customerId: customer.user.id,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          priceSnapshot: service.price,
          durationMinutes: service.durationMinutes,
          startsAt: completedStart,
          endsAt: new Date(completedStart.getTime() + 30 * 60 * 1000),
          status: 'COMPLETED',
          completedAt: completedStart,
        },
        {
          barbershopId,
          businessMemberId: barbershop.members[0].id,
          customerId: customer.user.id,
          serviceId: service.id,
          serviceNameSnapshot: service.name,
          priceSnapshot: service.price,
          durationMinutes: service.durationMinutes,
          startsAt: upcomingStart,
          endsAt: new Date(upcomingStart.getTime() + 30 * 60 * 1000),
          status: 'CONFIRMED',
        },
      ],
    });

    const revenueAnchor = DateTime.fromJSDate(completedStart)
      .setZone('Europe/Istanbul')
      .toISODate();
    const revenueResponse = await request(app.getHttpServer())
      .get(
        `/barbershops/${barbershopId}/appointments/revenue-summary?period=WEEK&anchor=${revenueAnchor}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    expect(revenueResponse.body).toMatchObject({
      period: 'WEEK',
      completed: 1,
      totalRevenue: '450.00',
      averageTicket: '450.00',
    });
    expect(
      (revenueResponse.body as { points: { revenue: string }[] }).points.reduce(
        (total, point) => total + Number(point.revenue),
        0,
      ),
    ).toBe(450);

    const monthlyRevenueResponse = await request(app.getHttpServer())
      .get(
        `/barbershops/${barbershopId}/appointments/revenue-summary?period=MONTH&anchor=${revenueAnchor}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(monthlyRevenueResponse.body).toMatchObject({
      period: 'MONTH',
      completed: 1,
      totalRevenue: '450.00',
    });
    expect(
      (monthlyRevenueResponse.body as { points: unknown[] }).points.length,
    ).toBeGreaterThanOrEqual(4);

    const yearlyRevenueResponse = await request(app.getHttpServer())
      .get(
        `/barbershops/${barbershopId}/appointments/revenue-summary?period=YEAR&anchor=${revenueAnchor}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(yearlyRevenueResponse.body).toMatchObject({
      period: 'YEAR',
      completed: 1,
      totalRevenue: '450.00',
    });
    expect(
      (yearlyRevenueResponse.body as { points: unknown[] }).points,
    ).toHaveLength(12);

    const response = await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/customers`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const customers = response.body as BusinessCustomerResponse[];

    expect(customers).toHaveLength(1);
    expect(customers[0]).toMatchObject({
      id: customer.user.id,
      totalAppointmentCount: 2,
      completedVisitCount: 1,
    });
    expect(customers[0].lastVisitAt).toEqual(expect.any(String));
    expect(customers[0].nextAppointmentAt).toEqual(expect.any(String));

    const upcomingAppointment = await prisma.appointment.findFirstOrThrow({
      where: {
        barbershopId,
        customerId: customer.user.id,
        status: 'CONFIRMED',
      },
    });
    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/${upcomingAppointment.id}/no-show`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);
    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/${upcomingAppointment.id}/complete`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(400);

    const completedAppointment = await prisma.appointment.findFirstOrThrow({
      where: {
        barbershopId,
        customerId: customer.user.id,
        status: 'COMPLETED',
      },
    });
    await prisma.haircutRecord.create({
      data: {
        appointmentId: completedAppointment.id,
        createdByMemberId: barbershop.members[0].id,
        styleName: 'Low Fade',
        notes: 'Yanlar 0.5 numara',
      },
    });

    await request(app.getHttpServer())
      .post(
        `/barbershops/${barbershopId}/appointments/${completedAppointment.id}/haircut-record/photos`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .attach('file', Buffer.from('not-written-without-consent'), {
        contentType: 'image/jpeg',
        filename: 'consent-test.jpg',
      })
      .expect(400)
      .expect(({ body }: { body: { message: string[] } }) => {
        expect(body.message).toContain(
          'Fotoğraf yüklemek için müşterinin açık izni alınmalıdır.',
        );
      });

    await request(app.getHttpServer())
      .post(
        `/barbershops/${barbershopId}/appointments/${completedAppointment.id}/haircut-record/photos`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .field('customerConsentConfirmed', 'true')
      .attach('file', Buffer.from('consented-test-photo'), {
        contentType: 'image/jpeg',
        filename: 'consented-test.jpg',
      })
      .expect(201);

    const uploadedPhoto = await prisma.haircutPhoto.findFirstOrThrow({
      where: { haircutRecord: { appointmentId: completedAppointment.id } },
    });
    uploadedPhotoStorageKey = uploadedPhoto.storageKey;
    expect(uploadedPhoto.customerConsentConfirmedAt).toBeInstanceOf(Date);

    const customerDetailResponse = await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/customers/${customer.user.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const customerDetail =
      customerDetailResponse.body as BusinessCustomerDetailResponse;

    expect(customerDetail).toMatchObject({
      id: customer.user.id,
      totalAppointmentCount: 2,
      completedVisitCount: 1,
    });
    expect(customerDetail.appointments).toHaveLength(2);
    const completedVisit = customerDetail.appointments.find(
      (appointment) => appointment.id === completedAppointment.id,
    );
    expect(completedVisit).toMatchObject({
      status: 'COMPLETED',
      haircutRecord: {
        styleName: 'Low Fade',
        notes: 'Yanlar 0.5 numara',
      },
    });
    expect(completedVisit).not.toHaveProperty('customer');
    expect(completedVisit).not.toHaveProperty('haircutRecord.photos');

    await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/customers/${customer.user.id}`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/customers/missing-customer`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(404);

    const detailResponse = await request(app.getHttpServer())
      .get(
        `/barbershops/${barbershopId}/appointments/${completedAppointment.id}`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(detailResponse.body).toMatchObject({
      id: completedAppointment.id,
      completedVisitCount: 1,
      serviceNameSnapshot: 'Test Kesim',
      customer: { id: customer.user.id },
      businessMember: { id: barbershop.members[0].id },
      barbershop: { id: barbershopId },
    });

    await request(app.getHttpServer())
      .get(
        `/barbershops/${barbershopId}/appointments/${completedAppointment.id}`,
      )
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(403);

    const arrivalStart = new Date(Date.now() - 5 * 60 * 1000);
    const arrivalAppointment = await prisma.appointment.create({
      data: {
        barbershopId,
        businessMemberId: barbershop.members[0].id,
        customerId: customer.user.id,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationMinutes: service.durationMinutes,
        startsAt: arrivalStart,
        endsAt: new Date(arrivalStart.getTime() + 30 * 60 * 1000),
      },
    });

    await app
      .get(NotificationsService)
      .notifyNewAppointment(arrivalAppointment.id);

    const notificationsResponse = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    const appointmentNotification = (
      notificationsResponse.body as {
        id: string;
        appointment: { id: string };
        readAt: string | null;
        type: string;
      }[]
    ).find(
      (notification) => notification.appointment.id === arrivalAppointment.id,
    );
    expect(appointmentNotification).toMatchObject({
      appointment: { id: arrivalAppointment.id },
      readAt: null,
      type: 'NEW_APPOINTMENT',
    });

    await request(app.getHttpServer())
      .patch(`/notifications/${appointmentNotification?.id}/read`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch('/notifications/read-all')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/notifications/preferences')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200)
      .expect(
        ({ body }: { body: { appointmentRemindersEnabled: boolean } }) => {
          expect(body.appointmentRemindersEnabled).toBe(true);
        },
      );
    await request(app.getHttpServer())
      .patch('/notifications/preferences')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ appointmentRemindersEnabled: false })
      .expect(200)
      .expect(
        ({ body }: { body: { appointmentRemindersEnabled: boolean } }) => {
          expect(body.appointmentRemindersEnabled).toBe(false);
        },
      );
    await request(app.getHttpServer())
      .patch('/notifications/preferences')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .send({ appointmentRemindersEnabled: true })
      .expect(200);

    const reminderStart = new Date(Date.now() + 90 * 60 * 1000);
    const reminderAppointment = await prisma.appointment.create({
      data: {
        barbershopId,
        businessMemberId: barbershop.members[0].id,
        customerId: customer.user.id,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationMinutes: service.durationMinutes,
        startsAt: reminderStart,
        endsAt: new Date(reminderStart.getTime() + 30 * 60 * 1000),
      },
    });
    await app.get(NotificationsService).reconcileAppointmentReminders();
    const reminderNotification = await prisma.appNotification.findFirst({
      where: {
        appointmentId: reminderAppointment.id,
        type: 'APPOINTMENT_REMINDER',
        userId: customer.user.id,
      },
    });
    expect(reminderNotification).not.toBeNull();
    expect(
      (
        await prisma.appointment.findUniqueOrThrow({
          where: { id: reminderAppointment.id },
          select: { reminder2hSentAt: true },
        })
      ).reminder2hSentAt,
    ).not.toBeNull();

    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/${arrivalAppointment.id}/arrived`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200)
      .expect(({ body }: { body: { status: string; arrivedAt: string } }) => {
        expect(body.status).toBe('ARRIVED');
        expect(body.arrivedAt).toEqual(expect.any(String));
      });

    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/${arrivalAppointment.id}/undo-arrival`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200)
      .expect(({ body }: { body: { status: string; arrivedAt: null } }) => {
        expect(body.status).toBe('CONFIRMED');
        expect(body.arrivedAt).toBeNull();
      });

    await request(app.getHttpServer())
      .patch(
        `/barbershops/${barbershopId}/appointments/${arrivalAppointment.id}/arrived`,
      )
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    await prisma.appointment.update({
      where: { id: arrivalAppointment.id },
      data: { autoCompleteAt: new Date(Date.now() - 1000) },
    });

    const forgottenArrivalAppointment = await prisma.appointment.create({
      data: {
        barbershopId,
        businessMemberId: barbershop.members[0].id,
        customerId: customer.user.id,
        serviceId: service.id,
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationMinutes: service.durationMinutes,
        startsAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        endsAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    });

    const reconciledAppointments = await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/appointments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(
      (reconciledAppointments.body as { id: string; status: string }[]).find(
        (appointment) => appointment.id === arrivalAppointment.id,
      )?.status,
    ).toBe('COMPLETED');
    expect(
      (reconciledAppointments.body as { id: string; status: string }[]).find(
        (appointment) => appointment.id === forgottenArrivalAppointment.id,
      )?.status,
    ).toBe('COMPLETED');

    await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/customers`)
      .expect(401);

    await request(app.getHttpServer())
      .get(
        `/barbershops/${barbershopId}/appointments/revenue-summary?period=MONTH`,
      )
      .expect(401);
  });

  afterAll(async () => {
    if (uploadedPhotoStorageKey) {
      await unlink(
        resolve(process.cwd(), 'uploads', uploadedPhotoStorageKey),
      ).catch(() => undefined);
    }
    if (barbershopId) {
      await prisma.appointment.deleteMany({ where: { barbershopId } });
      await prisma.service.deleteMany({ where: { barbershopId } });
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
