import { Matches } from 'class-validator';

export class ConfirmOwnershipTransferDto {
  @Matches(/^\d{6}$/, { message: 'Doğrulama kodu 6 rakamdan oluşmalıdır.' })
  code: string;
}
