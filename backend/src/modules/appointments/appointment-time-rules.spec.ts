import {
  arrivalOpensAt,
  canMarkCustomerArrived,
} from './appointment-time-rules';

describe('appointment time rules', () => {
  const startsAt = new Date('2026-09-28T12:00:00.000Z');

  it('opens customer arrival exactly 15 minutes before the appointment', () => {
    expect(arrivalOpensAt(startsAt).toISOString()).toBe(
      '2026-09-28T11:45:00.000Z',
    );
    expect(
      canMarkCustomerArrived(startsAt, new Date('2026-09-28T11:44:59.999Z')),
    ).toBe(false);
    expect(
      canMarkCustomerArrived(startsAt, new Date('2026-09-28T11:45:00.000Z')),
    ).toBe(true);
  });
});
