import * as Linking from 'expo-linking';

export function createBarbershopAccessLink(slug: string, code: string) {
  return Linking.createURL(`/access/${encodeURIComponent(slug)}`, {
    queryParams: { code },
  });
}
