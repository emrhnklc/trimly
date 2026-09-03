import { IsEmail, Matches } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @Matches(/^\d{6}$/, {
    message: 'Doğrulama kodu 6 rakamdan oluşmalıdır.',
  })
  code: string;
}
