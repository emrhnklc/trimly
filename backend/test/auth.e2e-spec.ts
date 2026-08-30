import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/database/prisma.service';
import { AppModule } from '../src/app.module';

type AuthResponseBody = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    businessMemberships: BusinessMembershipBody[];
    passwordHash?: string;
  };
};

type BusinessMembershipBody = {
  id: string;
  role: 'OWNER' | 'MANAGER' | 'BARBER' | 'APPRENTICE';
  isActive: boolean;
  isBookable: boolean;
  barbershop: {
    id: string;
    name: string;
    slug: string;
    profileImageUrl: string | null;
  };
};

type UserProfileBody = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  businessMemberships: BusinessMembershipBody[];
};

type PublicBarbershopBody = {
  slug: string;
  name: string;
};

function asAuthResponseBody(body: unknown): AuthResponseBody {
  return body as AuthResponseBody;
}

function asUserProfileBody(body: unknown): UserProfileBody {
  return body as UserProfileBody;
}

function asPublicBarbershopsBody(body: unknown): PublicBarbershopBody[] {
  return body as PublicBarbershopBody[];
}

describe('Authentication flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  const email = `e2e-${randomUUID()}@trimly.test`;
  const barbershopSlug = `e2e-${randomUUID()}`;
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

  it('registers a user and returns a JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'Customer',
      })
      .expect(201);

    const body = asAuthResponseBody(response.body);

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.user).toMatchObject({
      email,
      firstName: 'Test',
      lastName: 'Customer',
      businessMemberships: [],
    });
    expect(body.user.passwordHash).toBeUndefined();
  });

  it('logs in and can read the protected current-user endpoint', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = asAuthResponseBody(loginResponse.body).accessToken;

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(asUserProfileBody(meResponse.body)).toMatchObject({
      email,
      firstName: 'Test',
      businessMemberships: [],
    });
  });

  it('reads and updates only its own profile', async () => {
    const profileResponse = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(asUserProfileBody(profileResponse.body)).toMatchObject({
      email,
      firstName: 'Test',
    });

    const updateResponse = await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ firstName: 'Updated', phone: '5551234567' })
      .expect(200);

    expect(asUserProfileBody(updateResponse.body)).toMatchObject({
      firstName: 'Updated',
      phone: '5551234567',
    });
  });

  it('creates a barbershop and finds it in public search', async () => {
    await request(app.getHttpServer())
      .post('/barbershops')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'E2E Discovery Barber',
        slug: barbershopSlug,
        description: 'Test işletmesi',
      })
      .expect(201);

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    const ownerMembership = asUserProfileBody(
      meResponse.body,
    ).businessMemberships.find(
      (membership) => membership.barbershop.slug === barbershopSlug,
    );

    expect(ownerMembership).toMatchObject({
      role: 'OWNER',
      isActive: true,
      isBookable: false,
      barbershop: {
        name: 'E2E Discovery Barber',
        slug: barbershopSlug,
      },
    });

    if (!ownerMembership) throw new Error('Test owner üyeliği oluşturulamadı.');

    const createServiceResponse = await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/services`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'E2E Saç Kesimi',
        description: 'Hizmet yönetimi testi',
        durationMinutes: 30,
        price: '450,50',
      })
      .expect(201);
    const createdService = createServiceResponse.body as {
      id: string;
      durationMinutes: number;
      isActive: boolean;
      price: string;
    };

    expect(createdService).toMatchObject({ durationMinutes: 30, isActive: true });
    expect(Number(createdService.price)).toBe(450.5);

    await request(app.getHttpServer())
      .get(
        `/barbershops/${ownerMembership.barbershop.id}/services/management/${createdService.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }: { body: { id: string } }) => {
        expect(body.id).toBe(createdService.id);
      });

    const updateServiceResponse = await request(app.getHttpServer())
      .patch(
        `/barbershops/${ownerMembership.barbershop.id}/services/${createdService.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ durationMinutes: 45, isActive: false, price: '500.25' })
      .expect(200);

    expect(updateServiceResponse.body).toMatchObject({
      durationMinutes: 45,
      isActive: false,
    });
    expect(Number((updateServiceResponse.body as { price: string }).price)).toBe(500.25);

    const searchResponse = await request(app.getHttpServer())
      .get('/barbershops?search=discovery')
      .expect(200);
    const barbershops = asPublicBarbershopsBody(searchResponse.body);

    expect(
      barbershops.some(
        (barbershop) =>
          barbershop.slug === barbershopSlug &&
          barbershop.name === 'E2E Discovery Barber',
      ),
    ).toBe(true);
  });

  it('rejects an invalid registration body', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  afterAll(async () => {
    await prisma.service.deleteMany({
      where: { barbershop: { slug: barbershopSlug } },
    });
    await prisma.businessMember.deleteMany({
      where: { barbershop: { slug: barbershopSlug } },
    });
    await prisma.barbershop.deleteMany({ where: { slug: barbershopSlug } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });
});
