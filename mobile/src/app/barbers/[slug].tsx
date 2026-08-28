import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getPublicBarbershop } from '@/features/barbershops/api';
import { BarberPreviewCard } from '@/features/barbershops/components/BarberPreviewCard';
import { BarbershopGalleryPreview } from '@/features/barbershops/components/BarbershopGalleryPreview';
import { BarbershopHero } from '@/features/barbershops/components/BarbershopHero';
import { BarbershopInfoCard } from '@/features/barbershops/components/BarbershopInfoCard';
import { BarbershopServiceTags } from '@/features/barbershops/components/BarbershopServiceTags';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

export default function BarbershopProfileScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [barbershop, setBarbershop] = useState<PublicBarbershopDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBarbershop = useCallback(async () => {
    if (!slug) {
      setError('İşletme profil bağlantısı geçersiz.');
      setIsLoading(false);
      return;
    }

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

  async function shareBarbershop() {
    if (!barbershop) return;

    await Share.share({
      message: `${barbershop.name} işletmesini Trimly'de keşfet: trimly://barbers/${barbershop.slug}`,
      title: barbershop.name,
    });
  }

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (error || !barbershop) {
    return (
      <Screen>
        <View style={styles.errorState}>
          <AppText color="danger" style={styles.centerText} variant="heading">
            İşletme yüklenemedi
          </AppText>
          <AppText color="textMuted" style={styles.errorDescription}>
            {error || 'İşletme bulunamadı.'}
          </AppText>
          <View style={styles.retryButton}>
            <AppButton onPress={() => void loadBarbershop()} variant="secondary">
              Tekrar Dene
            </AppButton>
          </View>
        </View>
      </Screen>
    );
  }

  const canBook = Boolean(barbershop.services.length && barbershop.members.length);

  return (
    <Screen>
      <View style={styles.screenContent}>
        <View style={[styles.floatingAction, styles.backAction]}>
          <AppIconButton
            accessibilityLabel="Geri dön"
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            onPress={() => router.back()}
          />
        </View>
        <View style={[styles.floatingAction, styles.shareAction]}>
          <AppIconButton
            accessibilityLabel="İşletmeyi paylaş"
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            onPress={() => void shareBarbershop()}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BarbershopHero barbershop={barbershop} />
          <BarbershopInfoCard barbershop={barbershop} />

          <ProfileSection title="Hizmetler">
            <BarbershopServiceTags services={barbershop.services} />
          </ProfileSection>

          <ProfileSection title="Hakkında">
            <AppText color="textMuted" style={styles.description}>
              {barbershop.description || 'Bu işletme henüz kendisi hakkında bir açıklama eklememiş.'}
            </AppText>
          </ProfileSection>

          <ProfileSection title="Ekibimiz">
            {barbershop.members.length ? (
              barbershop.members.map((barber) => (
                <BarberPreviewCard barber={barber} key={barber.id} />
              ))
            ) : (
              <AppText color="textMuted">Henüz randevuya açık çalışan yok.</AppText>
            )}
          </ProfileSection>

          <ProfileSection title="Çalışma Galerisi">
            <BarbershopGalleryPreview />
          </ProfileSection>
        </ScrollView>

        <SafeAreaView edges={['bottom']} style={styles.footerSafeArea}>
          <View style={styles.footer}>
            <AppButton
              disabled={!canBook}
              onPress={() => router.push({ pathname: '/book', params: { slug: barbershop.slug } })}>
              Randevu Al
            </AppButton>
          </View>
        </SafeAreaView>
      </View>
    </Screen>
  );
}

function ProfileSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="heading">{title}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  errorState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  centerText: { textAlign: 'center' },
  errorDescription: { marginTop: spacing.xs, textAlign: 'center' },
  retryButton: { marginTop: spacing.xl, minWidth: 180 },
  screenContent: { flex: 1 },
  floatingAction: { position: 'absolute', top: spacing.sm, zIndex: 3 },
  backAction: { left: spacing.lg },
  shareAction: { right: spacing.lg },
  content: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  section: { marginTop: spacing.xl, paddingHorizontal: spacing.xs },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  description: { lineHeight: 22 },
  footerSafeArea: { backgroundColor: colors.surface },
  footer: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
