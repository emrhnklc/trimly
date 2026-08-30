import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { AppModule } from '../src/app.module';

type RegisterResponse = {
  accessToken: string;
  user: { id: string };
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

describe('Business customers (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let barbershopId: string;
  const ownerEmail = `customer-owner-${randomUUID()}@trimly.test`;
  const customerEmail = `customer-${randomUUID()}@trimly.test`;
  const password = 'very-safe-test-password';

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
    const owner = ownerResponse.body as RegisterResponse;

    const customerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: customerEmail,
        password,
        firstName: 'Customer',
        lastName: 'Test',
      })
      .expect(201);
    const customer = customerResponse.body as RegisterResponse;

    const barbershopResponse = await request(app.getHttpServer())
      .post('/barbershops')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({ name: 'Customer E2E Barber', slug: `customer-e2e-${randomUUID()}` })
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

    const reconciledAppointments = await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/appointments`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .expect(200);
    expect(
      (reconciledAppointments.body as { id: string; status: string }[]).find(
        (appointment) => appointment.id === arrivalAppointment.id,
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
    if (barbershopId) {
      await prisma.appointment.deleteMany({ where: { barbershopId } });
      await prisma.service.deleteMany({ where: { barbershopId } });
      await prisma.businessMember.deleteMany({ where: { barbershopId } });
      await prisma.bookingSettings.deleteMany({ where: { barbershopId } });
      await prisma.barbershop.deleteMany({ where: { id: barbershopId } });
    }
    await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, customerEmail] } } });
    await app.close();
  });
});
