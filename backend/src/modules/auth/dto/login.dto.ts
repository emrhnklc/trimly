import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'E-posta veya şifre hatalı.' })
  email: string;

  @IsString({ message: 'E-posta veya şifre hatalı.' })
  @MinLength(8, { message: 'E-posta veya şifre hatalı.' })
  @MaxLength(72, { message: 'E-posta veya şifre hatalı.' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  deviceName?: string;
}
