import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { businessRoleLabels } from '@/features/business/role-labels';
import { spacing } from '@/theme/spacing';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { enterCustomerMode } = useAppMode();
  const { activeMembership } = useBusiness();

  if (!activeMembership) return null;

  async function returnToCustomerMode() {
    await enterCustomerMode();
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View style={styles.content}>
        <BusinessScreenHeader title="Profil" />
        <AppCard style={styles.businessCard}>
          <AppText color="primary" variant="overline">AKTİF İŞLETME</AppText>
          <AppText style={styles.businessName} variant="heading">
            {activeMembership.barbershop.name}
          </AppText>
          <AppText color="textMuted">{businessRoleLabels[activeMembership.role]}</AppText>
        </AppCard>
        <View style={styles.actions}>
          <AppButton onPress={() => router.push('/business/select')} variant="secondary">
            Aktif İşletmeyi Değiştir
          </AppButton>
          <AppButton onPress={() => void returnToCustomerMode()} variant="ghost">
            Müşteri Moduna Dön
          </AppButton>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  businessCard: { marginTop: spacing.xl, padding: spacing.lg },
  businessName: { marginBottom: spacing.xxs, marginTop: spacing.xs },
  actions: { gap: spacing.xs, marginTop: spacing.xl },
});
