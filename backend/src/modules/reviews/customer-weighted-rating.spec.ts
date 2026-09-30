import {
  summarizeCustomerRatings,
  summarizeCustomerRatingsByKey,
} from './customer-weighted-rating';

describe('customer weighted rating', () => {
  it('gives each customer one equal contribution', () => {
    const summary = summarizeCustomerRatings([
      { _avg: { rating: 4.4 }, _count: { _all: 5 } },
      { _avg: { rating: 2 }, _count: { _all: 1 } },
    ]);

    expect(summary).toEqual({
      ratingAverage: 3.2,
      ratingCount: 6,
      ratingCustomerCount: 2,
    });
  });

  it('summarizes businesses independently', () => {
    const summaries = summarizeCustomerRatingsByKey(
      [
        { barbershopId: 'a', _avg: { rating: 5 }, _count: { _all: 2 } },
        { barbershopId: 'a', _avg: { rating: 3 }, _count: { _all: 1 } },
        { barbershopId: 'b', _avg: { rating: 4 }, _count: { _all: 1 } },
      ],
      'barbershopId',
    );

    expect(summaries.get('a')).toEqual({
      ratingAverage: 4,
      ratingCount: 3,
      ratingCustomerCount: 2,
    });
    expect(summaries.get('b')?.ratingAverage).toBe(4);
  });
});
