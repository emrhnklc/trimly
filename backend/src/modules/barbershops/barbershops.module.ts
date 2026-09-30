import { Module } from '@nestjs/common';
import { BarbershopReadinessService } from './barbershop-readiness.service';
import { BarbershopsController } from './barbershops.controller';
import { BarbershopsService } from './barbershops.service';

@Module({
  controllers: [BarbershopsController],
  providers: [BarbershopReadinessService, BarbershopsService],
  exports: [BarbershopReadinessService],
})
export class BarbershopsModule {}
