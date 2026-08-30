import { IsEnum, IsOptional, Matches } from 'class-validator';

export enum RevenuePeriod {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

export class RevenueSummaryQueryDto {
  @IsOptional()
  @IsEnum(RevenuePeriod)
  period?: RevenuePeriod = RevenuePeriod.WEEK;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  anchor?: string;
}
