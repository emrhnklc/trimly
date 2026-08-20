import { Module } from '@nestjs/common';
import { ScheduleBlocksController } from './schedule-blocks.controller';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  controllers: [SchedulesController, ScheduleBlocksController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
