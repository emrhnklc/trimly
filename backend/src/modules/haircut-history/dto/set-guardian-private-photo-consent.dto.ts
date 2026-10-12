import { IsBoolean } from 'class-validator';

export class SetGuardianPrivatePhotoConsentDto {
  @IsBoolean()
  allow: boolean;
}
