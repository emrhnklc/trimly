import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme/spacing';

export default function AppointmentPreviewScreen() {
  const router = useRouter();
  const { date, serviceName, shopName, time } = useLocalSearchParams<{ date: string; serviceName: string; shopName: string; time: string }>();
  return <Screen><View style={styles.content}>
    <AppButton onPress={() => router.back()} variant="ghost">‹ Geri</AppButton>
    <AppText style={styles.title} variant="displayLarge">Randevunu kontrol et</AppText>
    <AppCard style={styles.card}>
      <Row label="İşletme" value={shopName} />
      <Row label="Hizmet" value={serviceName} />
      <Row label="Tarih" value={date} />
      <Row label="Saat" value={time} />
    </AppCard>
    <AppButton onPress={() => undefined}>Randevuyu Onayla</AppButton>
  </View></Screen>;
}

function Row({ label, value }: { label: string; value: string }) { return <View style={styles.row}><AppText color="textMuted">{label}</AppText><AppText variant="label">{value}</AppText></View>; }

const styles = StyleSheet.create({ content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm }, title: { marginTop: spacing.xl }, card: { marginBottom: spacing.xl, marginTop: spacing.xxl }, row: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.xs } });
