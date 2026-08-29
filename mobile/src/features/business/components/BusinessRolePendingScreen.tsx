import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { businessRoleLabels } from '@/features/business/role-labels';
import { spacing } from '@/theme/spacing';

export function BusinessRolePendingScreen() {
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
        <AppText color="primary" variant="overline">İŞLETME MODU</AppText>
        <AppText style={styles.title} variant="displayLarge">
          {businessRoleLabels[activeMembership.role]} görünümü
        </AppText>
        <AppCard style={styles.card}>
          <AppText variant="heading">Owner ekranlarını sana açmadık</AppText>
          <AppText color="textMuted" style={styles.description}>
            Güvenli ilerlemek için önce OWNER ekranlarını tamamlıyoruz. Bu role özel sekmeleri sonraki turda aynı componentlerden oluşturacağız.
          </AppText>
        </AppCard>
        <View style={styles.action}>
          <AppButton onPress={() => void returnToCustomerMode()} variant="secondary">
            Müşteri Moduna Dön
          </AppButton>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  title: { marginTop: spacing.xs },
  card: { marginTop: spacing.xl, padding: spacing.lg },
  description: { lineHeight: 21, marginTop: spacing.sm },
  action: { marginTop: spacing.xl },
});
