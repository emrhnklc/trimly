import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getAvailability, getPublicBarbershop } from '@/features/barbershops/api';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { slug, memberId } = useLocalSearchParams<{ slug?: string; memberId?: string }>();
  const [shop, setShop] = useState<PublicBarbershopDetail | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const date = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (slug) void getPublicBarbershop(slug).then(setShop);
  }, [slug]);

  useEffect(() => {
    if (shop && memberId && selectedServiceId) void getAvailability(shop.id, memberId, selectedServiceId, date).then((result) => { setSlots(result.slots.map((slot) => slot.startTime)); setSelectedTime(null); });
  }, [date, memberId, selectedServiceId, shop]);

  return (
    <Screen><View style={styles.content}>
      <AppText variant="displayLarge">Hizmet seç</AppText>
    <AppText color="textMuted" style={styles.subtitle}>{slug ? (shop?.name ?? 'Yükleniyor…') : 'Randevu almak için önce bir berber dükkânı seçmelisin.'}</AppText>
    {!slug ? <View style={styles.emptyAction}><AppButton onPress={() => router.push('/barbers')}>Berberleri Keşfet</AppButton></View> : null}
      {slug && !shop ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {shop?.services.map((service) => (
        <Pressable key={service.id} onPress={() => setSelectedServiceId(service.id)}>
          <AppCard style={[styles.card, selectedServiceId === service.id && styles.selected]}>
            <AppText variant="label">{service.name}</AppText>
            <AppText color="textMuted" style={styles.meta} variant="bodySmall">{service.durationMinutes} dk · ₺{service.price}</AppText>
          </AppCard>
        </Pressable>
      ))}
      {selectedServiceId ? <><AppText style={styles.timesTitle} variant="heading">Bugünün uygun saatleri</AppText><View style={styles.slots}>{slots.map((time) => <Pressable key={time} onPress={() => setSelectedTime(time)}><AppCard style={[styles.slot, selectedTime === time && styles.selected]}><AppText>{time}</AppText></AppCard></Pressable>)}</View></> : null}
      {slug ? <View style={styles.continue}><AppButton disabled={!selectedTime} onPress={() => undefined}>Randevuyu Önizle</AppButton></View> : null}
    </View></Screen>
  );
}

const styles = StyleSheet.create({ content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl }, subtitle: { marginTop: spacing.sm }, emptyAction: { marginTop: spacing.xl }, loader: { marginTop: spacing.xxl }, card: { marginTop: spacing.sm }, selected: { borderColor: colors.primary, borderWidth: 2 }, meta: { marginTop: spacing.xxs }, timesTitle: { marginTop: spacing.xl }, slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm }, slot: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }, continue: { marginTop: spacing.xl } });
