import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
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

    await request(app.getHttpServer())
      .get(`/barbershops/${barbershopId}/customers`)
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
