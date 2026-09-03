import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

export class RedeemBarbershopAccessDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(/^[A-HJ-NP-Z2-9]{8}$/, {
    message: 'Erişim kodu 8 geçerli karakterden oluşmalıdır.',
  })
  code: string;
}
