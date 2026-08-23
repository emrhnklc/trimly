import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getPublicBarbershop } from '@/features/barbershops/api';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BookAppointmentScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [shop, setShop] = useState<PublicBarbershopDetail | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (slug) void getPublicBarbershop(slug).then(setShop);
  }, [slug]);

  return (
    <Screen><View style={styles.content}>
      <AppText variant="displayLarge">Hizmet seç</AppText>
      <AppText color="textMuted" style={styles.subtitle}>{slug ? (shop?.name ?? 'Yükleniyor…') : 'Önce bir dükkân ve berber seçmelisin.'}</AppText>
      {slug && !shop ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {shop?.services.map((service) => (
        <Pressable key={service.id} onPress={() => setSelectedServiceId(service.id)}>
          <AppCard style={[styles.card, selectedServiceId === service.id && styles.selected]}>
            <AppText variant="label">{service.name}</AppText>
            <AppText color="textMuted" style={styles.meta} variant="bodySmall">{service.durationMinutes} dk · ₺{service.price}</AppText>
          </AppCard>
        </Pressable>
      ))}
      {slug ? <AppButton disabled={!selectedServiceId} onPress={() => undefined}>Tarih ve Saat Seç</AppButton> : null}
    </View></Screen>
  );
}

const styles = StyleSheet.create({ content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl }, subtitle: { marginTop: spacing.sm }, loader: { marginTop: spacing.xxl }, card: { marginTop: spacing.sm }, selected: { borderColor: colors.primary, borderWidth: 2 }, meta: { marginTop: spacing.xxs } });
