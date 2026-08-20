import { Module } from '@nestjs/common';
import { CustomerHaircutHistoryController } from './customer-haircut-history.controller';
import { HaircutHistoryController } from './haircut-history.controller';
import { HaircutHistoryService } from './haircut-history.service';

@Module({
  controllers: [HaircutHistoryController, CustomerHaircutHistoryController],
  providers: [HaircutHistoryService],
})
export class HaircutHistoryModule {}
