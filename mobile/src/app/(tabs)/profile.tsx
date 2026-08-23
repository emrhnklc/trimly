import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { spacing } from '@/theme/spacing';

export default function ProfileScreen() {
  const router = useRouter();
  const { isReady, signOut, user } = useAuth();

  if (!isReady) return null;

  return (
    <Screen><View style={styles.content}>
      <AppText variant="displayLarge">Profilim</AppText>
      {user ? (
        <>
          <AppCard style={styles.card}>
            <AppText variant="heading">{user.firstName} {user.lastName}</AppText>
            <AppText color="textMuted" style={styles.email}>{user.email}</AppText>
          </AppCard>
          <AppText color="textMuted">Favorilerin ve geçmiş tıraşların yakında burada olacak.</AppText>
          <View style={styles.action}><AppButton onPress={() => void signOut()} variant="ghost">Çıkış Yap</AppButton></View>
        </>
      ) : (
        <>
          <AppText color="textMuted" style={styles.description}>Randevularını, favorilerini ve tıraş geçmişini görmek için giriş yap.</AppText>
          <View style={styles.action}><AppButton onPress={() => router.push('/auth/login')}>Giriş Yap</AppButton></View>
          <AppButton onPress={() => router.push('/auth/register')} variant="ghost">Hesap Oluştur</AppButton>
        </>
      )}
    </View></Screen>
  );
}

const styles = StyleSheet.create({ content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl }, card: { marginTop: spacing.xl }, email: { marginTop: spacing.xxs }, description: { marginTop: spacing.md }, action: { marginTop: spacing.xl } });
