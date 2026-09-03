import { BadRequestException } from '@nestjs/common';
import { normalizeTurkishPhone } from './normalize-turkish-phone';

describe('normalizeTurkishPhone', () => {
  it.each([
    ['0555 123 45 67', '+905551234567'],
    ['+90 (555) 123 45 67', '+905551234567'],
    ['905551234567', '+905551234567'],
    ['5551234567', '+905551234567'],
  ])('%s değerini E.164 biçimine çevirir', (input, expected) => {
    expect(normalizeTurkishPhone(input)).toBe(expected);
  });

  it.each(['12345', '+90 212 555 10 10', '+90 455 123 45 67'])(
    '%s değerini reddeder',
    (input) => {
      expect(() => normalizeTurkishPhone(input)).toThrow(BadRequestException);
    },
  );
});
