import { Transform } from 'class-transformer';
import { Equals } from 'class-validator';

export class AddHaircutPhotoDto {
  @Transform(
    ({ value }: { value: unknown }) => value === true || value === 'true',
  )
  @Equals(true, {
    message: 'Fotoğraf yüklemek için müşterinin açık izni alınmalıdır.',
  })
  customerConsentConfirmed: boolean;
}
