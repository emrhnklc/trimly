import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './database/prisma.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuthModule } from './modules/auth/auth.module';
import { BarbershopsModule } from './modules/barbershops/barbershops.module';
import { BookingSettingsModule } from './modules/booking-settings/booking-settings.module';
import { CustomersModule } from './modules/customers/customers.module';
import { HealthModule } from './modules/health/health.module';
import { HaircutHistoryModule } from './modules/haircut-history/haircut-history.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { MembersModule } from './modules/members/members.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ServicesModule } from './modules/services/services.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { UsersModule } from './modules/users/users.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { LocationsModule } from './modules/locations/locations.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ThrottlerModule.forRoot({
      errorMessage:
        'Çok fazla istek gönderildi. Lütfen kısa süre sonra tekrar dene.',
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    AvailabilityModule,
    AppointmentsModule,
    AuthModule,
    BarbershopsModule,
    BookingSettingsModule,
    CustomersModule,
    MembersModule,
    NotificationsModule,
    ServicesModule,
    SchedulesModule,
    HealthModule,
    HaircutHistoryModule,
    FavoritesModule,
    UsersModule,
    PortfolioModule,
    ReviewsModule,
    LocationsModule,
    CampaignsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
