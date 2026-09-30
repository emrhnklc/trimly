export type CustomerRatingGroup = {
  _avg?: true | { rating?: number | null };
  _count?: true | { _all?: number };
};

export function summarizeCustomerRatings(groups: CustomerRatingGroup[]) {
  const averages = groups
    .map((group) =>
      group._avg && group._avg !== true ? group._avg.rating : null,
    )
    .filter((rating): rating is number => rating !== null);
  return {
    ratingAverage: averages.length
      ? averages.reduce((total, rating) => total + rating, 0) / averages.length
      : null,
    ratingCount: groups.reduce(
      (total, group) =>
        total +
        (group._count && group._count !== true ? (group._count._all ?? 0) : 0),
      0,
    ),
    ratingCustomerCount: averages.length,
  };
}

export function summarizeCustomerRatingsByKey<
  Key extends string,
  Group extends CustomerRatingGroup & Record<Key, string>,
>(groups: Group[], key: Key) {
  const grouped = new Map<string, Group[]>();
  for (const group of groups) {
    const id = group[key];
    grouped.set(id, [...(grouped.get(id) ?? []), group]);
  }
  return new Map(
    [...grouped.entries()].map(([id, customerGroups]) => [
      id,
      summarizeCustomerRatings(customerGroups),
    ]),
  );
}
