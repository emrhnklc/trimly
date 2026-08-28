import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  ProfileMenuGroup,
  type ProfileMenuItem,
} from '@/features/profile/components/ProfileMenuGroup';
import { ProfileMenuIdentity } from '@/features/profile/components/ProfileMenuIdentity';
import { spacing } from '@/theme/spacing';

export default function ProfileOverviewScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  if (!user) return null;

  const quickActions: ProfileMenuItem[] = [
    {
      badge: 'YAKINDA',
      icon: { ios: 'bell', android: 'notifications', web: 'notifications' },
      id: 'notifications',
      label: 'Bildirimler',
    },
    {
      icon: { ios: 'person.crop.circle', android: 'manage_accounts', web: 'manage_accounts' },
      id: 'settings',
      label: 'Hesap Ayarları',
      onPress: () => router.push('/profile/settings'),
    },
    {
      badge: 'YAKINDA',
      icon: { ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' },
      id: 'support',
      label: 'Yardım & Destek',
    },
    {
      icon: { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' },
      id: 'styles',
      label: 'Kaydettiğim Stiller',
      onPress: () => router.push('/profile/history'),
    },
    {
      icon: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
      id: 'favorites',
      label: 'Favori Berberlerim',
      onPress: () => router.push('/favorites'),
    },
    {
      badge: 'YAKINDA',
      icon: { ios: 'ticket', android: 'confirmation_number', web: 'confirmation_number' },
      id: 'referral',
      label: 'Davet Kodunu Kullan',
    },
  ];

  const otherActions: ProfileMenuItem[] = [
    {
      icon: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
      id: 'history',
      label: 'Geçmiş Tıraşlarım',
      onPress: () => router.push('/profile/history'),
    },
    {
      danger: true,
      icon: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
      id: 'logout',
      label: 'Çıkış Yap',
      onPress: () => void signOut(),
    },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileMenuIdentity onPress={() => router.push('/profile/edit')} user={user} />
        <ProfileMenuGroup items={quickActions} title="Hızlı İşlemler" />
        <ProfileMenuGroup items={otherActions} title="Diğer" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
