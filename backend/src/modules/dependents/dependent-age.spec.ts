import { isMinorOnDate } from './dependent-age';

describe('isMinorOnDate', () => {
  it('requires guardian consent until the eighteenth birthday', () => {
    const birthDate = new Date('2008-10-07T00:00:00.000Z');

    expect(isMinorOnDate(birthDate, new Date('2026-10-06T00:00:00.000Z'))).toBe(
      true,
    );
    expect(isMinorOnDate(birthDate, new Date('2026-10-07T00:00:00.000Z'))).toBe(
      false,
    );
  });
});
