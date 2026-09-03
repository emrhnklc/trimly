import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  BusinessRole,
  PrismaClient,
  type Service,
  Weekday,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not configured.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const seedPassword = 'Trimly123!';
const openDays = [
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

type ShopSeed = {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  owner: { email: string; firstName: string; lastName: string };
  manager?: { email: string; firstName: string; lastName: string };
  barber: { email: string; firstName: string; lastName: string };
  apprentice?: { email: string; firstName: string; lastName: string };
  services: Array<{
    name: string;
    description: string;
    durationMinutes: number;
    price: string;
  }>;
};

const shops: ShopSeed[] = [
  {
    name: 'Trimly Studio Alsancak',
    slug: 'trimly-studio-alsancak',
    description:
      'Klasik kesimden modern fade modellerine, sıcak ve özenli bir berber deneyimi.',
    address: 'Alsancak, Konak / İzmir',
    phone: '+90 232 555 10 10',
    owner: {
      email: 'owner.alsancak@trimly.dev',
      firstName: 'Emir',
      lastName: 'Kaya',
    },
    manager: {
      email: 'manager.alsancak@trimly.dev',
      firstName: 'Selin',
      lastName: 'Yılmaz',
    },
    barber: {
      email: 'barber.alsancak@trimly.dev',
      firstName: 'Mert',
      lastName: 'Aydın',
    },
    apprentice: {
      email: 'apprentice.alsancak@trimly.dev',
      firstName: 'Efe',
      lastName: 'Çelik',
    },
    services: [
      {
        name: 'Standart Saç Kesimi',
        description: 'Yıkama ve şekillendirme dahil.',
        durationMinutes: 30,
        price: '450.00',
      },
      {
        name: 'Sakal Tıraşı',
        description: 'Sıcak havlu ve bakım dahil.',
        durationMinutes: 20,
        price: '300.00',
      },
      {
        name: 'Saç Kesimi + Sakal',
        description: 'Eksiksiz saç ve sakal bakımı.',
        durationMinutes: 50,
        price: '700.00',
      },
    ],
  },
  {
    name: 'Kordon Barber Club',
    slug: 'kordon-barber-club',
    description:
      'Kordon manzarasında klasik berber kültürü ve modern dokunuşlar.',
    address: 'Kordon, Konak / İzmir',
    phone: '+90 232 555 20 20',
    owner: {
      email: 'owner.kordon@trimly.dev',
      firstName: 'Burak',
      lastName: 'Demir',
    },
    barber: {
      email: 'barber.kordon@trimly.dev',
      firstName: 'Ahmet',
      lastName: 'Yılmaz',
    },
    services: [
      {
        name: 'Klasik Saç Kesimi',
        description: 'Makas ağırlıklı klasik kesim.',
        durationMinutes: 35,
        price: '500.00',
      },
      {
        name: 'Fade Kesim',
        description: 'Low, mid veya high fade seçeneği.',
        durationMinutes: 45,
        price: '600.00',
      },
      {
        name: 'Premium Paket',
        description: 'Saç, sakal, yıkama ve bakım.',
        durationMinutes: 75,
        price: '950.00',
      },
    ],
  },
  {
    name: 'Bornova Makas',
    slug: 'bornova-makas',
    description: 'Hızlı, temiz ve ulaşılabilir mahalle berberliği.',
    address: 'Kazımdirik, Bornova / İzmir',
    phone: '+90 232 555 30 30',
    owner: {
      email: 'owner.bornova@trimly.dev',
      firstName: 'Can',
      lastName: 'Öztürk',
    },
    barber: {
      email: 'barber.bornova@trimly.dev',
      firstName: 'Umut',
      lastName: 'Şahin',
    },
    services: [
      {
        name: 'Saç Kesimi',
        description: 'Günlük kullanıma uygun modern kesim.',
        durationMinutes: 30,
        price: '400.00',
      },
      {
        name: 'Saç + Sakal',
        description: 'Saç kesimi ve sakal düzenleme.',
        durationMinutes: 45,
        price: '600.00',
      },
      {
        name: 'Çocuk Saç Kesimi',
        description: '12 yaş ve altı için.',
        durationMinutes: 25,
        price: '300.00',
      },
    ],
  },
];

async function upsertService(
  barbershopId: string,
  service: ShopSeed['services'][number],
): Promise<Service> {
  const existing = await prisma.service.findFirst({
    where: { barbershopId, name: service.name },
  });

  if (existing) {
    return prisma.service.update({
      where: { id: existing.id },
      data: { ...service, isActive: true },
    });
  }

  return prisma.service.create({
    data: { barbershopId, ...service },
  });
}

async function seedShop(shop: ShopSeed, passwordHash: string) {
  const emailVerifiedAt = new Date();
  const owner = await prisma.user.upsert({
    where: { email: shop.owner.email },
    update: { ...shop.owner, emailVerifiedAt, passwordHash },
    create: { ...shop.owner, emailVerifiedAt, passwordHash },
  });
  const barber = await prisma.user.upsert({
    where: { email: shop.barber.email },
    update: { ...shop.barber, emailVerifiedAt, passwordHash },
    create: { ...shop.barber, emailVerifiedAt, passwordHash },
  });
  const manager = shop.manager
    ? await prisma.user.upsert({
        where: { email: shop.manager.email },
        update: { ...shop.manager, emailVerifiedAt, passwordHash },
        create: { ...shop.manager, emailVerifiedAt, passwordHash },
      })
    : null;
  const apprentice = shop.apprentice
    ? await prisma.user.upsert({
        where: { email: shop.apprentice.email },
        update: { ...shop.apprentice, emailVerifiedAt, passwordHash },
        create: { ...shop.apprentice, emailVerifiedAt, passwordHash },
      })
    : null;

  const barbershop = await prisma.barbershop.upsert({
    where: { slug: shop.slug },
    update: {
      name: shop.name,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      timezone: 'Europe/Istanbul',
    },
    create: {
      name: shop.name,
      slug: shop.slug,
      description: shop.description,
      address: shop.address,
      phone: shop.phone,
      timezone: 'Europe/Istanbul',
    },
  });

  const ownerMember = await prisma.businessMember.upsert({
    where: {
      userId_barbershopId: { userId: owner.id, barbershopId: barbershop.id },
    },
    update: { role: BusinessRole.OWNER, isActive: true, isBookable: true },
    create: {
      userId: owner.id,
      barbershopId: barbershop.id,
      role: BusinessRole.OWNER,
      isBookable: true,
    },
  });
  const barberMember = await prisma.businessMember.upsert({
    where: {
      userId_barbershopId: { userId: barber.id, barbershopId: barbershop.id },
    },
    update: { role: BusinessRole.BARBER, isActive: true, isBookable: true },
    create: {
      userId: barber.id,
      barbershopId: barbershop.id,
      role: BusinessRole.BARBER,
      isBookable: true,
    },
  });
  if (manager) {
    await prisma.businessMember.upsert({
      where: {
        userId_barbershopId: {
          userId: manager.id,
          barbershopId: barbershop.id,
        },
      },
      update: { role: BusinessRole.MANAGER, isActive: true, isBookable: false },
      create: {
        userId: manager.id,
        barbershopId: barbershop.id,
        role: BusinessRole.MANAGER,
        isActive: true,
        isBookable: false,
      },
    });
  }
  const apprenticeMember = apprentice
    ? await prisma.businessMember.upsert({
        where: {
          userId_barbershopId: {
            userId: apprentice.id,
            barbershopId: barbershop.id,
          },
        },
        update: {
          role: BusinessRole.APPRENTICE,
          isActive: true,
          isBookable: false,
        },
        create: {
          userId: apprentice.id,
          barbershopId: barbershop.id,
          role: BusinessRole.APPRENTICE,
          isActive: true,
          isBookable: false,
        },
      })
    : null;

  await prisma.bookingSettings.upsert({
    where: { barbershopId: barbershop.id },
    update: {
      minBookingNoticeMinutes: 60,
      maxBookingAdvanceDays: 14,
      slotIntervalMinutes: 15,
      customerCancellationEnabled: true,
      cancellationNoticeMinutes: 120,
    },
    create: {
      barbershopId: barbershop.id,
      minBookingNoticeMinutes: 60,
      maxBookingAdvanceDays: 14,
      slotIntervalMinutes: 15,
      customerCancellationEnabled: true,
      cancellationNoticeMinutes: 120,
    },
  });

  for (const weekday of openDays) {
    await prisma.workingHours.upsert({
      where: { barbershopId_weekday: { barbershopId: barbershop.id, weekday } },
      update: { startTime: '09:00', endTime: '19:00' },
      create: {
        barbershopId: barbershop.id,
        weekday,
        startTime: '09:00',
        endTime: '19:00',
      },
    });

    const scheduledMembers = apprenticeMember
      ? [ownerMember, barberMember, apprenticeMember]
      : [ownerMember, barberMember];
    for (const member of scheduledMembers) {
      await prisma.memberWorkingHours.upsert({
        where: {
          businessMemberId_weekday: { businessMemberId: member.id, weekday },
        },
        update: { startTime: '09:00', endTime: '19:00' },
        create: {
          businessMemberId: member.id,
          weekday,
          startTime: '09:00',
          endTime: '19:00',
        },
      });
    }
  }

  const services = await Promise.all(
    shop.services.map((service) => upsertService(barbershop.id, service)),
  );

  for (const service of services) {
    for (const member of [ownerMember, barberMember]) {
      await prisma.businessMemberService.upsert({
        where: {
          businessMemberId_serviceId: {
            businessMemberId: member.id,
            serviceId: service.id,
          },
        },
        update: {},
        create: { businessMemberId: member.id, serviceId: service.id },
      });
    }
  }

  return barbershop;
}

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  for (const shop of shops) {
    const barbershop = await seedShop(shop, passwordHash);
    console.log(`Seeded: ${barbershop.name}`);
  }

  console.log('Development login: owner.alsancak@trimly.dev / Trimly123!');
  console.log('Manager login: manager.alsancak@trimly.dev / Trimly123!');
  console.log('Apprentice login: apprentice.alsancak@trimly.dev / Trimly123!');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
