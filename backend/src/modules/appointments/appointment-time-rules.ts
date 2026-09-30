export const ARRIVAL_EARLY_WINDOW_MINUTES = 15;

export function arrivalOpensAt(startsAt: Date) {
  return new Date(
    startsAt.getTime() - ARRIVAL_EARLY_WINDOW_MINUTES * 60 * 1000,
  );
}

export function canMarkCustomerArrived(startsAt: Date, now = new Date()) {
  return now >= arrivalOpensAt(startsAt);
}
