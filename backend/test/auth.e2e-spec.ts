import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
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
    phone: string | null;
    birthDate: string | null;
    businessMemberships: BusinessMembershipBody[];
    passwordHash?: string;
  };
};

type VerificationPendingBody = {
  email: string;
  expiresAt: string;
  verificationRequired: true;
  devVerificationCode: string;
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
  birthDate: string | null;
  profileImageUrl: string | null;
  businessMemberships: BusinessMembershipBody[];
};

type PublicBarbershopBody = {
  slug: string;
  name: string;
};

type BusinessMemberBody = {
  serviceAssignments: { service: { id: string } }[];
};

function asAuthResponseBody(body: unknown): AuthResponseBody {
  return body as AuthResponseBody;
}

function asVerificationPendingBody(body: unknown): VerificationPendingBody {
  return body as VerificationPendingBody;
}

async function verifyRegistration(app: INestApplication<App>, body: unknown) {
  const pending = asVerificationPendingBody(body);
  const response = await request(app.getHttpServer())
    .post('/auth/verify-email')
    .send({ code: pending.devVerificationCode, email: pending.email })
    .expect(201);

  return asAuthResponseBody(response.body);
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
  const employeeEmail = `e2e-employee-${randomUUID()}@trimly.test`;
  const accessCustomerEmail = `e2e-access-${randomUUID()}@trimly.test`;
  const bookingCustomerEmail = `e2e-booking-access-${randomUUID()}@trimly.test`;
  const phoneOwnerEmail = `e2e-phone-owner-${randomUUID()}@trimly.test`;
  const phoneDuplicateEmail = `e2e-phone-duplicate-${randomUUID()}@trimly.test`;
  const barbershopSlug = `e2e-${randomUUID()}`;
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

  it('registers a user, requires email verification and then returns a JWT', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        firstName: 'Test',
        lastName: 'Customer',
      })
      .expect(201);

    const pending = asVerificationPendingBody(response.body);

    expect(pending).toMatchObject({
      email,
      verificationRequired: true,
    });
    expect(pending.devVerificationCode).toMatch(/^\d{6}$/);
    expect(response.body).not.toHaveProperty('accessToken');

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(403)
      .expect(({ body }: { body: { code: string } }) => {
        expect(body.code).toBe('EMAIL_NOT_VERIFIED');
      });

    await request(app.getHttpServer())
      .post('/auth/resend-email-verification')
      .send({ email })
      .expect(429)
      .expect(({ body }: { body: { code: string } }) => {
        expect(body.code).toBe('EMAIL_VERIFICATION_RATE_LIMITED');
      });

    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ code: '000000', email })
      .expect(400)
      .expect(({ body }: { body: { code: string } }) => {
        expect(body.code).toBe('EMAIL_VERIFICATION_CODE_INVALID');
      });

    const body = await verifyRegistration(app, pending);
    accessToken = body.accessToken;
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

  it('resets the password without revealing accounts and invalidates old sessions', async () => {
    const unknownResponse = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: `unknown-${randomUUID()}@trimly.test` })
      .expect(201);

    expect(unknownResponse.body).toEqual({
      message: 'Bu e-posta kullanılabiliyorsa şifre sıfırlama kodu gönderildi.',
    });

    const forgotResponse = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(201);
    const resetCode = (forgotResponse.body as { devResetCode: string })
      .devResetCode;
    expect(resetCode).toMatch(/^\d{6}$/);

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: '000000', newPassword: 'New-safe-password2!' })
      .expect(400)
      .expect(({ body }: { body: { code: string } }) => {
        expect(body.code).toBe('PASSWORD_RESET_CODE_INVALID');
      });

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ email, code: resetCode, newPassword: 'New-safe-password2!' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(401);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'New-safe-password2!' })
      .expect(201);
    accessToken = asAuthResponseBody(loginResponse.body).accessToken;

    const otherLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'New-safe-password2!' })
      .expect(201);
    const otherAccessToken = asAuthResponseBody(
      otherLoginResponse.body,
    ).accessToken;

    const sessionsResponse = await request(app.getHttpServer())
      .get('/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(sessionsResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isCurrent: true }),
        expect.objectContaining({ isCurrent: false }),
      ]),
    );

    await request(app.getHttpServer())
      .post('/auth/sessions/revoke-others')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect(({ body }: { body: { revokedCount: number } }) => {
        expect(body.revokedCount).toBeGreaterThanOrEqual(1);
      });

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${otherAccessToken}`)
      .expect(401);
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
      .send({
        firstName: 'Updated',
        phone: '5551234567',
        birthDate: '1997-08-14',
      })
      .expect(200);

    expect(asUserProfileBody(updateResponse.body)).toMatchObject({
      firstName: 'Updated',
      phone: '+905551234567',
    });
    expect(asUserProfileBody(updateResponse.body).birthDate).toMatch(
      /^1997-08-14T00:00:00\.000Z$/,
    );

    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ birthDate: null })
      .expect(200)
      .expect(({ body }: { body: UserProfileBody }) => {
        expect(body.birthDate).toBeNull();
      });

    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ birthDate: '2026-02-30' })
      .expect(400);

    const uploadResponse = await request(app.getHttpServer())
      .post('/users/me/profile-photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xdb]), {
        contentType: 'image/jpeg',
        filename: 'profile.jpg',
      })
      .expect(201);
    const uploadedProfile = asUserProfileBody(uploadResponse.body);
    expect(uploadedProfile.profileImageUrl).toMatch(
      /\/users\/profile-images\/[0-9a-f-]{36}\.jpg$/,
    );

    const imageUrl = new URL(uploadedProfile.profileImageUrl as string);
    await request(app.getHttpServer())
      .get(imageUrl.pathname)
      .expect(200)
      .expect('Content-Type', /image\/jpeg/);

    await request(app.getHttpServer())
      .post('/users/me/profile-photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('not an image'), {
        contentType: 'image/jpeg',
        filename: 'invalid.jpg',
      })
      .expect(400);

    await request(app.getHttpServer())
      .delete('/users/me/profile-photo')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }: { body: UserProfileBody }) => {
        expect(body.profileImageUrl).toBeNull();
      });
  });

  it('normalizes phone numbers and explains duplicate phone conflicts', async () => {
    const firstResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: phoneOwnerEmail,
        password,
        firstName: 'Phone',
        lastName: 'Owner',
        phone: '0532 987 65 43',
      })
      .expect(201);

    const firstUser = await verifyRegistration(app, firstResponse.body);
    expect(firstUser.user.phone).toBe('+905329876543');

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: phoneDuplicateEmail,
        password,
        firstName: 'Phone',
        lastName: 'Duplicate',
        phone: '+90 (532) 987 65 43',
      })
      .expect(409)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toBe(
          'Bu telefon numarası başka bir hesapta kayıtlı.',
        );
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

    const bookingSettingsResponse = await request(app.getHttpServer())
      .put(`/barbershops/${ownerMembership.barbershop.id}/booking-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        minBookingNoticeMinutes: 90,
        maxBookingAdvanceDays: 21,
        slotIntervalMinutes: 15,
        customerCancellationEnabled: true,
        cancellationNoticeMinutes: 180,
      })
      .expect(200);

    expect(bookingSettingsResponse.body).toMatchObject({
      minBookingNoticeMinutes: 90,
      maxBookingAdvanceDays: 21,
      slotIntervalMinutes: 15,
      customerCancellationEnabled: true,
      cancellationNoticeMinutes: 180,
    });

    await request(app.getHttpServer())
      .put(`/barbershops/${ownerMembership.barbershop.id}/booking-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ slotIntervalMinutes: 7 })
      .expect(400);

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

    expect(createdService).toMatchObject({
      durationMinutes: 30,
      isActive: true,
    });
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
    expect(
      Number((updateServiceResponse.body as { price: string }).price),
    ).toBe(500.25);

    await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/invitations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'OWNER', expiresInHours: 24 })
      .expect(400);

    const invitationResponse = await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/invitations`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'APPRENTICE', expiresInHours: 24 })
      .expect(201);
    const invitation = invitationResponse.body as { token: string };
    expect(invitation.token).toMatch(/^[A-Za-z0-9_-]+$/);

    const employeeResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: employeeEmail,
        password,
        firstName: 'Employee',
        lastName: 'Test',
      })
      .expect(201);
    const employee = await verifyRegistration(app, employeeResponse.body);
    const acceptedResponse = await request(app.getHttpServer())
      .post(`/invitations/${invitation.token}/accept`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({})
      .expect(201);
    const employeeMembership = acceptedResponse.body as {
      id: string;
      role: string;
      isBookable: boolean;
    };
    expect(employeeMembership).toMatchObject({
      role: 'APPRENTICE',
      isBookable: false,
    });

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/appointments/mine`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .patch(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'BARBER', isActive: true })
      .expect(200);

    await request(app.getHttpServer())
      .put(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/bookable`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isBookable: true })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/barbershops/${ownerMembership.barbershop.id}/working-hours`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        hours: [{ weekday: 'MONDAY', startTime: '09:00', endTime: '19:00' }],
      })
      .expect(200);

    const memberHoursResponse = await request(app.getHttpServer())
      .put(
        `/barbershops/${ownerMembership.barbershop.id}/working-hours/members/${employeeMembership.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        hours: [{ weekday: 'MONDAY', startTime: '10:00', endTime: '18:00' }],
      })
      .expect(200);
    expect(memberHoursResponse.body).toEqual([
      { weekday: 'MONDAY', startTime: '10:00', endTime: '18:00' },
    ]);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/working-hours/me`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .expect(200)
      .expect([{ weekday: 'MONDAY', startTime: '10:00', endTime: '18:00' }]);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/appointments/mine`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .expect(200)
      .expect([]);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/appointments`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .put(
        `/barbershops/${ownerMembership.barbershop.id}/working-hours/members/${employeeMembership.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        hours: [{ weekday: 'MONDAY', startTime: '08:00', endTime: '18:00' }],
      })
      .expect(400);

    const blockResponse = await request(app.getHttpServer())
      .post(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/schedule-blocks`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'TIME_OFF',
        startsAt: '2099-01-05T06:00:00.000Z',
        endsAt: '2099-01-05T15:00:00.000Z',
        note: 'E2E izin testi',
      })
      .expect(201);
    const createdBlock = blockResponse.body as { id: string };

    const blocksResponse = await request(app.getHttpServer())
      .get(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/schedule-blocks`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(blocksResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: createdBlock.id, type: 'TIME_OFF' }),
      ]),
    );

    await request(app.getHttpServer())
      .post(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/schedule-blocks`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'BREAK',
        startsAt: '2099-01-05T07:00:00.000Z',
        endsAt: '2099-01-05T08:00:00.000Z',
      })
      .expect(409);

    await request(app.getHttpServer())
      .delete(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/schedule-blocks/${createdBlock.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect({ success: true });

    await request(app.getHttpServer())
      .put(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/services/${createdService.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(200);

    const memberResponse = await request(app.getHttpServer())
      .get(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(memberResponse.body).toMatchObject({
      role: 'BARBER',
      isBookable: true,
    });
    expect(
      (memberResponse.body as BusinessMemberBody).serviceAssignments[0].service
        .id,
    ).toBe(createdService.id);

    const apprenticeResponse = await request(app.getHttpServer())
      .patch(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ role: 'APPRENTICE' })
      .expect(200);
    expect(apprenticeResponse.body).toMatchObject({
      role: 'APPRENTICE',
      isBookable: false,
    });

    await request(app.getHttpServer())
      .put(
        `/barbershops/${ownerMembership.barbershop.id}/members/${employeeMembership.id}/bookable`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isBookable: true })
      .expect(400);

    const profileResponse = await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        description: 'Güncellenmiş işletme profili',
        phone: '+90 555 000 00 00',
        address: 'Alsancak, İzmir',
        profileImageUrl: 'https://example.com/profile.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        isDiscoverable: false,
      })
      .expect(200);
    expect(profileResponse.body).toMatchObject({
      address: 'Alsancak, İzmir',
      isDiscoverable: false,
    });

    const hiddenSearchResponse = await request(app.getHttpServer())
      .get('/barbershops?search=discovery')
      .expect(200);
    expect(
      asPublicBarbershopsBody(hiddenSearchResponse.body).some(
        (barbershop) => barbershop.slug === barbershopSlug,
      ),
    ).toBe(false);

    await request(app.getHttpServer())
      .get(`/barbershops/${barbershopSlug}`)
      .expect(200)
      .expect(({ body }: { body: { isDiscoverable: boolean } }) => {
        expect(body.isDiscoverable).toBe(false);
      });

    // Publishing now requires a complete booking-ready shop. Leave only the
    // location missing so the first request still checks that requirement.
    await prisma.barbershop.update({
      where: { id: ownerMembership.barbershop.id },
      data: {
        phone: '+905551112233',
        profileImageUrl: 'https://trimly.test/profile.jpg',
        coverImageUrl: 'https://trimly.test/cover.jpg',
      },
    });
    await prisma.barbershopPhoto.createMany({
      data: [0, 1].map((sortOrder) => ({
        barbershopId: ownerMembership.barbershop.id,
        storageKey: `e2e-gallery-${randomUUID()}.jpg`,
        mimeType: 'image/jpeg',
        sizeBytes: 1,
        sortOrder,
      })),
    });
    await prisma.service.update({
      where: { id: createdService.id },
      data: { isActive: true },
    });
    await prisma.businessMember.update({
      where: { id: employeeMembership.id },
      data: { role: 'BARBER', isBookable: true },
    });

    await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isDiscoverable: true })
      .expect(400)
      .expect(({ body }: { body: { message: string } }) => {
        expect(body.message).toContain('doğrulanmış işletme konumu');
      });

    await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        latitude: 38.4372,
        longitude: 27.1434,
        isDiscoverable: true,
      })
      .expect(200);

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

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/access-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toEqual(
          expect.objectContaining({
            accessMode: 'PUBLIC',
            hasAccessCode: false,
            accessCodeUpdatedAt: null,
          }),
        );
      });

    await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/access-code/rotate`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({})
      .expect(403);

    const firstCodeResponse = await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/access-code/rotate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);
    const firstAccessCode = (firstCodeResponse.body as { code: string }).code;
    expect(firstAccessCode).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);

    const storedAccessCode =
      await prisma.barbershopAccessCode.findUniqueOrThrow({
        where: { barbershopId: ownerMembership.barbershop.id },
      });
    expect(storedAccessCode.codeHash).not.toBe(firstAccessCode);
    await expect(
      bcrypt.compare(firstAccessCode, storedAccessCode.codeHash),
    ).resolves.toBe(true);

    const secondCodeResponse = await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/access-code/rotate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(201);
    const secondAccessCode = (secondCodeResponse.body as { code: string }).code;
    const rotatedAccessCode =
      await prisma.barbershopAccessCode.findUniqueOrThrow({
        where: { barbershopId: ownerMembership.barbershop.id },
      });

    expect(secondAccessCode).not.toBe(firstAccessCode);
    await expect(
      bcrypt.compare(firstAccessCode, rotatedAccessCode.codeHash),
    ).resolves.toBe(false);
    await expect(
      bcrypt.compare(secondAccessCode, rotatedAccessCode.codeHash),
    ).resolves.toBe(true);

    const accessSettingsResponse = await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}/access-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ accessMode: 'CODE_REQUIRED' })
      .expect(200);
    expect(accessSettingsResponse.body).toMatchObject({
      accessMode: 'CODE_REQUIRED',
      isDiscoverable: true,
    });

    const codeRequiredSearchResponse = await request(app.getHttpServer())
      .get('/barbershops?search=discovery')
      .expect(200);
    expect(
      asPublicBarbershopsBody(codeRequiredSearchResponse.body).some(
        (barbershop) => barbershop.slug === barbershopSlug,
      ),
    ).toBe(false);

    const bookingCustomerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: bookingCustomerEmail,
        password,
        firstName: 'Booking',
        lastName: 'Access',
      })
      .expect(201);
    const bookingCustomer = await verifyRegistration(
      app,
      bookingCustomerResponse.body,
    );

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/services`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .expect(403)
      .expect(({ body }: { body: { code: string } }) => {
        expect(body.code).toBe('BARBERSHOP_ACCESS_REQUIRED');
      });

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/availability`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .query({
        memberId: employeeMembership.id,
        serviceId: createdService.id,
        date: '2099-01-05',
      })
      .expect(403);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/barbers`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/barbershops/${ownerMembership.barbershop.id}/appointments`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .send({})
      .expect(403);

    await request(app.getHttpServer())
      .post(`/barbershops/${barbershopSlug}/access`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .send({ code: secondAccessCode })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/services`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/barbers`)
      .set('Authorization', `Bearer ${bookingCustomer.accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post(`/barbershops/${barbershopSlug}/access`)
      .send({ code: secondAccessCode })
      .expect(401);

    await request(app.getHttpServer())
      .post(`/barbershops/${barbershopSlug}/access`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ code: firstAccessCode })
      .expect(403);

    const grantedAccessResponse = await request(app.getHttpServer())
      .post(`/barbershops/${barbershopSlug}/access`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ code: secondAccessCode.toLowerCase() })
      .expect(201);
    expect(grantedAccessResponse.body).toMatchObject({
      barbershopId: ownerMembership.barbershop.id,
      slug: barbershopSlug,
      accessGranted: true,
      alreadyGranted: false,
    });

    const storedCustomerAccess =
      await prisma.customerBarbershopAccess.findUniqueOrThrow({
        where: {
          userId_barbershopId: {
            userId: employee.user.id,
            barbershopId: ownerMembership.barbershop.id,
          },
        },
      });
    expect(storedCustomerAccess.revokedAt).toBeNull();

    const accessCustomerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: accessCustomerEmail,
        password,
        firstName: 'Access',
        lastName: 'Limit',
      })
      .expect(201);
    const accessCustomer = await verifyRegistration(
      app,
      accessCustomerResponse.body,
    );
    const wrongAccessCode =
      secondAccessCode === 'AAAAAAAA' ? 'BBBBBBBB' : 'AAAAAAAA';

    for (let attemptNumber = 1; attemptNumber < 5; attemptNumber += 1) {
      await request(app.getHttpServer())
        .post(`/barbershops/${barbershopSlug}/access`)
        .set('Authorization', `Bearer ${accessCustomer.accessToken}`)
        .send({ code: wrongAccessCode })
        .expect(403);
    }

    await request(app.getHttpServer())
      .post(`/barbershops/${barbershopSlug}/access`)
      .set('Authorization', `Bearer ${accessCustomer.accessToken}`)
      .send({ code: wrongAccessCode })
      .expect(429);

    await request(app.getHttpServer())
      .post(`/barbershops/${barbershopSlug}/access`)
      .set('Authorization', `Bearer ${accessCustomer.accessToken}`)
      .send({ code: secondAccessCode })
      .expect(429);

    await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}/access-settings`)
      .set('Authorization', `Bearer ${employee.accessToken}`)
      .send({ accessMode: 'PUBLIC' })
      .expect(403);

    await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}/access-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ accessMode: 'PRIVATE' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/barbershops/${ownerMembership.barbershop.id}/access-settings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ accessMode: 'PUBLIC' })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/barbershops/${ownerMembership.barbershop.id}/services`)
      .set('Authorization', `Bearer ${accessCustomer.accessToken}`)
      .expect(200);
  }, 15_000);

  it('rejects an invalid registration body', () => {
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);
  });

  afterAll(async () => {
    await prisma.businessInvitation.deleteMany({
      where: { barbershop: { slug: barbershopSlug } },
    });
    await prisma.service.deleteMany({
      where: { barbershop: { slug: barbershopSlug } },
    });
    await prisma.businessMember.deleteMany({
      where: { barbershop: { slug: barbershopSlug } },
    });
    await prisma.workingHours.deleteMany({
      where: { barbershop: { slug: barbershopSlug } },
    });
    await prisma.barbershop.deleteMany({ where: { slug: barbershopSlug } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            email,
            employeeEmail,
            accessCustomerEmail,
            bookingCustomerEmail,
            phoneOwnerEmail,
            phoneDuplicateEmail,
          ],
        },
      },
    });
    await app.close();
  });
});
