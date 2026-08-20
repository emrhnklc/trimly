import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';
import { WorkingHoursItemDto } from './update-working-hours.dto';

export class UpdateMemberWorkingHoursDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursItemDto)
  hours: WorkingHoursItemDto[];
}
