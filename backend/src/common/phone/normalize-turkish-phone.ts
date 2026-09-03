import { BadRequestException } from '@nestjs/common';

export function normalizeTurkishPhone(value: string) {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('0090')) digits = digits.slice(4);
  else if (digits.startsWith('90')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);

  if (!/^5\d{9}$/.test(digits)) {
    throw new BadRequestException(
      'Telefon numarası +90 5xx xxx xx xx biçiminde geçerli bir cep telefonu olmalıdır.',
    );
  }

  return `+90${digits}`;
}
