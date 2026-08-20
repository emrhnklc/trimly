import { IsBoolean } from 'class-validator';

export class UpdateMemberBookableDto {
  @IsBoolean()
  isBookable: boolean;
}
