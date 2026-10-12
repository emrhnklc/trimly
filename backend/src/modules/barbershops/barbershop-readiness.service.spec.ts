import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { PrismaService } from '../../database/prisma.service';
import { BarbershopReadinessService } from './barbershop-readiness.service';

describe('BarbershopReadinessService', () => {
  const findUnique = jest.fn();
  const prisma = {
    barbershop: { findUnique },
  } as unknown as PrismaService;
  const service = new BarbershopReadinessService(prisma);

  beforeEach(() => {
    findUnique.mockReset();
  });

  it('marks a business ready when a bookable member can perform an assigned service during overlapping hours', async () => {
    findUnique.mockResolvedValue(readyBusiness());

    await expect(service.getReadiness('business-1')).resolves.toEqual({
      acceptsBookings: true,
      bookingSuspendedUntil: null,
      staffAvailabilityBlocked: false,
      checks: {
        activeService: true,
        bookableMember: true,
        businessHours: true,
        coverPhoto: true,
        galleryPhotos: true,
        location: true,
        memberWorkingHours: true,
        phone: true,
        profilePhoto: true,
      },
      isBookingOpen: true,
      isDiscoverable: true,
      isReadyToPublish: true,
      missingRequirements: [],
    });
  });

  it('blocks publishing when the member has no working hours', async () => {
    const business = readyBusiness();
    business.members[0].workingHours = [];
    findUnique.mockResolvedValue(business);

    const readiness = await service.getReadiness('business-1');

    expect(readiness.isReadyToPublish).toBe(false);
    expect(readiness.missingRequirements).toContainEqual({
      code: 'MEMBER_WORKING_HOURS',
      label: 'çalışanın hizmet süresine uygun vardiyası',
    });
  });

  it.each([
    ['phone', null, 'PHONE', 'işletme telefonu'],
    ['profileImageUrl', null, 'PROFILE_PHOTO', 'profil fotoğrafı'],
    ['coverImageUrl', null, 'COVER_PHOTO', 'kapak fotoğrafı'],
  ] as const)(
    'blocks publishing when %s is missing',
    async (field, value, code, label) => {
      const business = readyBusiness();
      business[field] = value;
      findUnique.mockResolvedValue(business);

      const readiness = await service.getReadiness('business-1');

      expect(readiness.missingRequirements).toContainEqual({ code, label });
    },
  );

  it('requires at least two gallery photos before publishing', async () => {
    const business = readyBusiness();
    business.galleryPhotos = [{ id: 'photo-1' }];
    findUnique.mockResolvedValue(business);

    const readiness = await service.getReadiness('business-1');

    expect(readiness.checks.galleryPhotos).toBe(false);
    expect(readiness.missingRequirements).toContainEqual({
      code: 'GALLERY_PHOTOS',
      label: 'en az 2 galeri fotoğrafı',
    });
  });

  it('blocks publishing when business and member hours do not overlap', async () => {
    const business = readyBusiness();
    business.members[0].workingHours[0] = {
      weekday: 'MONDAY',
      startTime: '19:00',
      endTime: '21:00',
    };
    findUnique.mockResolvedValue(business);

    await expect(service.assertReadyToPublish('business-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('blocks publishing when the overlap is shorter than the assigned service', async () => {
    const business = readyBusiness();
    business.members[0].workingHours[0] = {
      weekday: 'MONDAY',
      startTime: '18:30',
      endTime: '19:00',
    };
    findUnique.mockResolvedValue(business);

    const readiness = await service.getReadiness('business-1');

    expect(readiness.checks.memberWorkingHours).toBe(false);
  });

  it('uses pending location values while publishing a profile update', async () => {
    const business = readyBusiness();
    business.latitude = null;
    business.longitude = null;
    findUnique.mockResolvedValue(business);

    await expect(
      service.assertReadyToPublish('business-1', {
        latitude: 38.4237,
        longitude: 27.1428,
      }),
    ).resolves.toMatchObject({ isReadyToPublish: true });
  });

  it('uses pending contact and image values while publishing a profile update', async () => {
    const business = readyBusiness();
    business.phone = null;
    business.profileImageUrl = null;
    business.coverImageUrl = null;
    findUnique.mockResolvedValue(business);

    await expect(
      service.assertReadyToPublish('business-1', {
        phone: '+905551112233',
        profileImageUrl: 'https://trimly.app/new-profile.jpg',
        coverImageUrl: 'https://trimly.app/new-cover.jpg',
      }),
    ).resolves.toMatchObject({ isReadyToPublish: true });
  });

  it('throws when the business does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.getReadiness('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('keeps a ready but paused business closed for new bookings', async () => {
    const business = readyBusiness();
    business.acceptsBookings = false;
    findUnique.mockResolvedValue(business);

    const readiness = await service.getReadiness('business-1');

    expect(readiness.isReadyToPublish).toBe(true);
    expect(readiness.isBookingOpen).toBe(false);
    await expect(service.assertBookingOpen('business-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('keeps existing setup readiness but closes new bookings during a reliability suspension', async () => {
    const business = readyBusiness();
    business.reliabilityActions = [
      { endsAt: new Date(Date.now() + 86_400_000) },
    ];
    findUnique.mockResolvedValue(business);

    const readiness = await service.getReadiness('business-1');

    expect(readiness.isReadyToPublish).toBe(true);
    expect(readiness.isBookingOpen).toBe(false);
    expect(readiness.bookingSuspendedUntil).toEqual(
      business.reliabilityActions[0].endsAt,
    );
  });

  it('blocks new bookings while the only available member awaits owner review', async () => {
    const business = readyBusiness();
    business.members[0].reliabilityActions = [{ id: 'hold-1' }];
    findUnique.mockResolvedValue(business);

    const readiness = await service.getReadiness('business-1');

    expect(readiness.isReadyToPublish).toBe(true);
    expect(readiness.staffAvailabilityBlocked).toBe(true);
    expect(readiness.isBookingOpen).toBe(false);
  });
});

function readyBusiness() {
  return {
    acceptsBookings: true,
    reliabilityActions: [] as { endsAt: Date }[],
    isDiscoverable: true,
    latitude: 38.4237 as number | null,
    longitude: 27.1428 as number | null,
    phone: '+905551112233' as string | null,
    profileImageUrl: 'https://trimly.app/profile.jpg' as string | null,
    coverImageUrl: 'https://trimly.app/cover.jpg' as string | null,
    galleryPhotos: [{ id: 'photo-1' }, { id: 'photo-2' }, { id: 'photo-3' }],
    services: [{ id: 'service-1' }],
    workingHours: [{ weekday: 'MONDAY', startTime: '09:00', endTime: '19:00' }],
    members: [
      {
        reliabilityActions: [] as { id: string }[],
        workingHours: [
          { weekday: 'MONDAY', startTime: '10:00', endTime: '18:00' },
        ],
        serviceAssignments: [{ service: { durationMinutes: 45 } }],
      },
    ],
  };
}
