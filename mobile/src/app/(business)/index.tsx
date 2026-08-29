import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ScrollView, StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { businessRoleLabels } from '@/features/business/role-labels';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function BusinessModeHomeScreen() {
  const router = useRouter();
  const { enterCustomerMode } = useAppMode();
  const { user } = useAuth();
  const { activeMembership } = useBusiness();

  if (!user || !activeMembership) return null;

  async function returnToCustomerMode() {
    await enterCustomerMode();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <TrimlyLogo size="small" />
          <View style={styles.modeBadge}>
            <SymbolView
              name={{ ios: 'briefcase', android: 'business_center', web: 'business_center' }}
              size={14}
              tintColor={colors.primary}
            />
          </View>
        </View>

        <AppText color="primary" style={styles.eyebrow} variant="overline">
          İŞLETME MODU
        </AppText>
        <AppText style={styles.title} variant="displayLarge">
          Hoş geldin, {user.firstName}.
        </AppText>
        <AppText color="textMuted" style={styles.description}>
          İşletme ekranlarını artık seçili salonun ve buradaki rolün belirleyecek.
        </AppText>

        <AppCard style={styles.businessCard}>
          <View style={styles.businessIcon}>
            <SymbolView
              name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
              size={25}
              tintColor={colors.primary}
            />
          </View>
          <View style={styles.businessDetails}>
            <AppText variant="heading">{activeMembership.barbershop.name}</AppText>
            <AppText color="primary" style={styles.role} variant="bodySmall">
              {businessRoleLabels[activeMembership.role]}
            </AppText>
          </View>
        </AppCard>

        <AppCard style={styles.nextStepCard}>
          <AppText variant="heading">İşletme görünümü hazır</AppText>
          <AppText color="textMuted" style={styles.nextStepDescription}>
            Sonraki aşamada role göre ana sayfa ve alt sekmeleri bu alanın üzerine kuracağız.
          </AppText>
        </AppCard>

        <View style={styles.actions}>
          <AppButton onPress={() => router.push('/business/select')} variant="secondary">
            Aktif İşletmeyi Değiştir
          </AppButton>
          <AppButton onPress={() => void returnToCustomerMode()} variant="ghost">
            Müşteri Moduna Dön
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  topBarSpacer: { height: 40, width: 40 },
  modeBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  eyebrow: { marginTop: spacing.xxl },
  title: { marginTop: spacing.xs },
  description: { lineHeight: 22, marginTop: spacing.sm },
  businessCard: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: spacing.lg,
  },
  businessIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  businessDetails: { flex: 1, marginLeft: spacing.md },
  role: { marginTop: spacing.xxs },
  nextStepCard: { marginTop: spacing.md, padding: spacing.lg },
  nextStepDescription: { lineHeight: 21, marginTop: spacing.sm },
  actions: { gap: spacing.xs, marginTop: spacing.xl },
});
