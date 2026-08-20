import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ScheduleBlockType } from '@prisma/client';

export class CreateMemberScheduleBlockDto {
  @IsEnum(ScheduleBlockType)
  type: ScheduleBlockType;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
