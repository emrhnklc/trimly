import * as Linking from 'expo-linking';

export function createBusinessInvitationLink(token: string) {
  return Linking.createURL(`/join/${encodeURIComponent(token)}`);
}
