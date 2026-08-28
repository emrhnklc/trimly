import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getPublicBarber, getPublicBarbershop } from '@/features/barbershops/api';
import { BarberProfileHero } from '@/features/barbershops/components/BarberProfileHero';
import type {
  PublicBarberDetail,
  PublicBarbershopDetail,
} from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

export default function PublicBarberProfileScreen() {
  const router = useRouter();
  const { memberId, slug } = useLocalSearchParams<{ memberId?: string; slug?: string }>();
  const [shop, setShop] = useState<PublicBarbershopDetail | null>(null);
  const [barber, setBarber] = useState<PublicBarberDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!slug || !memberId) {
      setError('Berber profil bağlantısı geçersiz.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextShop = await getPublicBarbershop(slug);
      const nextBarber = await getPublicBarber(nextShop.id, memberId);
      setShop(nextShop);
      setBarber(nextBarber);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Berber profili yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [memberId, slug]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadProfile(), 0);
    return () => clearTimeout(requestId);
  }, [loadProfile]);

  return (
    <Screen>
      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.errorState}>
          <AppText color="danger" style={styles.centerText} variant="heading">Profil yüklenemedi</AppText>
          <AppText color="textMuted" style={styles.errorDescription}>{error}</AppText>
          <View style={styles.retryButton}>
            <AppButton onPress={() => void loadProfile()} variant="secondary">Tekrar Dene</AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && shop && barber ? (
        <View style={styles.screenContent}>
          <View style={styles.backButton}>
            <AppIconButton
              accessibilityLabel="Geri dön"
              icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              onPress={() => router.back()}
            />
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <BarberProfileHero barber={barber} shop={shop} />

            <AppCard style={styles.infoCard}>
              <InfoCell
                icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
                label="İşletme konumu"
                value={shop.address || 'Adres eklenmemiş'}
              />
              <View style={styles.infoDivider} />
              <InfoCell
                icon={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
                label="Aktif hizmet"
                value={`${barber.serviceAssignments.length} hizmet`}
              />
            </AppCard>

            <View style={styles.section}>
              <SectionTitle title="Uzmanlık Alanları" />
              <View style={styles.tags}>
                {barber.serviceAssignments.map(({ service }) => (
                  <View key={service.id} style={styles.tag}>
                    <AppText variant="bodySmall">{service.name}</AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <SectionTitle title="Hakkında" />
              <AppText color="textMuted">
                Bu berber henüz kendisi hakkında bir açıklama eklememiş.
              </AppText>
            </View>

            <View style={styles.section}>
              <SectionTitle title="Çalışma Galerisi" />
              <AppCard style={styles.galleryEmpty}>
                <SymbolView
                  name={{ ios: 'photo.on.rectangle.angled', android: 'photo_library', web: 'photo_library' }}
                  size={28}
                  tintColor={colors.primary}
                />
                <View style={styles.galleryText}>
                  <AppText variant="label">Portföy henüz eklenmemiş</AppText>
                  <AppText color="textMuted" style={styles.galleryDescription} variant="bodySmall">
                    Berberin herkese açık çalışmaları ileride burada yer alacak.
                  </AppText>
                </View>
              </AppCard>
            </View>

            <View style={styles.bookingButton}>
              <AppButton
                disabled={!barber.serviceAssignments.length}
                onPress={() =>
                  router.push({
                    pathname: '/book',
                    params: { memberId: barber.id, slug: shop.slug },
                  })
                }>
                Randevu Al
              </AppButton>
            </View>
          </ScrollView>
        </View>
      ) : null}
    </Screen>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCell}>
      <SymbolView name={icon} size={17} tintColor={colors.primary} />
      <View style={styles.infoText}>
        <AppText color="textMuted" variant="bodySmall">{label}</AppText>
        <AppText numberOfLines={1} style={styles.infoValue} variant="label">{value}</AppText>
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <AppText style={styles.sectionTitle} variant="heading">{title}</AppText>;
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  errorState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  centerText: { textAlign: 'center' },
  errorDescription: { marginTop: spacing.xs, textAlign: 'center' },
  retryButton: { marginTop: spacing.xl, minWidth: 180 },
  screenContent: { flex: 1 },
  backButton: { left: spacing.xl, position: 'absolute', top: spacing.sm, zIndex: 2 },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  infoCard: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  infoCell: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  infoText: { flex: 1, marginLeft: spacing.xs },
  infoValue: { marginTop: 2 },
  infoDivider: { backgroundColor: colors.border, height: 38, marginHorizontal: spacing.sm, width: 1 },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  galleryEmpty: { alignItems: 'center', flexDirection: 'row', padding: spacing.md },
  galleryText: { flex: 1, marginLeft: spacing.sm },
  galleryDescription: { marginTop: spacing.xxs },
  bookingButton: { marginTop: spacing.xl },
});
