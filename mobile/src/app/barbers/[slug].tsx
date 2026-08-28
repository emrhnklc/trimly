import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getPublicBarbershop } from '@/features/barbershops/api';
import { BarberPreviewCard } from '@/features/barbershops/components/BarberPreviewCard';
import { BarbershopHero } from '@/features/barbershops/components/BarbershopHero';
import { BarbershopInfoCard } from '@/features/barbershops/components/BarbershopInfoCard';
import { ServicePreviewCard } from '@/features/barbershops/components/ServicePreviewCard';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BarbershopProfileScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [barbershop, setBarbershop] = useState<PublicBarbershopDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBarbershop = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);

    try {
      setBarbershop(await getPublicBarbershop(slug));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'İşletme yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadBarbershop(), 0);
    return () => clearTimeout(requestId);
  }, [loadBarbershop]);

  return (
    <Screen>
      <View style={styles.topBar}>
        <AppIconButton
          accessibilityLabel="Geri dön"
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          onPress={() => router.back()}
        />
        <AppText variant="heading">İşletme Profili</AppText>
        <View style={styles.topBarSpacer} />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.errorState}>
          <AppText color="danger" style={styles.centerText} variant="heading">İşletme yüklenemedi</AppText>
          <AppText color="textMuted" style={styles.errorDescription}>{error}</AppText>
          <View style={styles.retryButton}>
            <AppButton onPress={() => void loadBarbershop()} variant="secondary">Tekrar Dene</AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && barbershop ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BarbershopHero barbershop={barbershop} />

          <AppText color="textMuted" style={styles.description}>
            {barbershop.description || 'Bu işletme için henüz açıklama eklenmemiş.'}
          </AppText>

          <BarbershopInfoCard barbershop={barbershop} />

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="heading">Hizmetler</AppText>
            {barbershop.services.length ? (
              barbershop.services.map((service) => (
                <ServicePreviewCard key={service.id} service={service} />
              ))
            ) : (
              <AppText color="textMuted">Henüz aktif hizmet eklenmemiş.</AppText>
            )}
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="heading">Ekibimiz</AppText>
            {barbershop.members.length ? (
              barbershop.members.map((barber) => (
                <BarberPreviewCard
                  barber={barber}
                  key={barber.id}
                  onPress={() =>
                    router.push({
                      pathname: '/barbers/[slug]/[memberId]',
                      params: { memberId: barber.id, slug: barbershop.slug },
                    })
                  }
                />
              ))
            ) : (
              <AppText color="textMuted">Henüz randevuya açık berber yok.</AppText>
            )}
          </View>

          <View style={styles.bookingButton}>
            <AppButton
              disabled={!barbershop.services.length || !barbershop.members.length}
              onPress={() => router.push({ pathname: '/book', params: { slug: barbershop.slug } })}>
              Randevu Al
            </AppButton>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  topBarSpacer: { width: 44 },
  loader: { marginTop: spacing.xxxl },
  errorState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  centerText: { textAlign: 'center' },
  errorDescription: { marginTop: spacing.xs, textAlign: 'center' },
  retryButton: { marginTop: spacing.xl, minWidth: 180 },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  description: { marginVertical: spacing.lg },
  section: { marginTop: spacing.xxl },
  sectionTitle: { marginBottom: spacing.sm },
  bookingButton: { marginTop: spacing.xl },
});
