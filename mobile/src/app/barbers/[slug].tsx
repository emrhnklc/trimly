import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getPublicBarbershop } from '@/features/barbershops/api';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BarbershopProfileScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [barbershop, setBarbershop] = useState<PublicBarbershopDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void getPublicBarbershop(slug).then(setBarbershop).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'İşletme yüklenemedi.');
    });
  }, [slug]);

  return (
    <Screen>
      <View style={styles.content}>
        <AppButton onPress={() => router.back()} variant="ghost">‹ Geri</AppButton>
        {!barbershop && !error ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {error ? <AppText color="danger" style={styles.message}>{error}</AppText> : null}
        {barbershop ? (
          <>
            <AppText style={styles.title} variant="displayLarge">{barbershop.name}</AppText>
            {barbershop.address ? <AppText color="primary" style={styles.address}>{barbershop.address}</AppText> : null}
            <AppText color="textMuted" style={styles.description}>{barbershop.description || 'Bu işletme için henüz açıklama eklenmemiş.'}</AppText>
            <AppCard style={styles.infoCard}>
              <AppText color="textMuted" variant="bodySmall">İletişim</AppText>
              <AppText style={styles.infoText}>{barbershop.phone || 'Telefon bilgisi yakında eklenecek.'}</AppText>
            </AppCard>
            <AppButton onPress={() => router.push('/book')}>Randevu Al</AppButton>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  loader: { marginTop: spacing.xxl },
  title: { marginTop: spacing.xl },
  address: { marginTop: spacing.sm },
  description: { marginTop: spacing.md },
  infoCard: { marginBottom: spacing.xl, marginTop: spacing.xxl },
  infoText: { marginTop: spacing.xxs },
  message: { marginTop: spacing.xl },
});
