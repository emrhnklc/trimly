import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { getBusinessCancellationRecoveryOptions } from '@/features/appointments/api';
import type {
  BusinessCancellationRecoveryOptions,
  CustomerAppointment,
} from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicBarbershop, getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessCancellationRecoveryCard({
  appointment,
}: {
  appointment: CustomerAppointment;
}) {
  const router = useRouter();
  const { token } = useAuth();
  const colors = useThemeColors();
  const [recovery, setRecovery] = useState<BusinessCancellationRecoveryOptions | null>(null);
  const [nearbyShops, setNearbyShops] = useState<PublicBarbershop[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      const requestId = setTimeout(() => {
        if (reloadKey > 0) setRecovery(null);
        setLoading(true);
        setError(null);
        void (async () => {
          try {
            const result = await getBusinessCancellationRecoveryOptions(appointment.id, token);
            if (!active) return;
            setRecovery(result);
            setNearbyShops([]);
            if (
              result.options.length === 0 &&
              result.shop.latitude !== null &&
              result.shop.longitude !== null
            ) {
              const nearby = await getPublicBarbershops(undefined, {
                latitude: result.shop.latitude,
                longitude: result.shop.longitude,
              }).catch(() => []);
              const serviceName = appointment.serviceNameSnapshot.toLocaleLowerCase('tr-TR');
              const matchingShops = nearby
                .filter((shop) =>
                  shop.id !== result.shop.id &&
                  shop.serviceNames?.some(
                    (name) => name.toLocaleLowerCase('tr-TR') === serviceName,
                  ),
                )
                .slice(0, 8);
              const bookableShops = await Promise.all(
                matchingShops.map(async (shop) => {
                  const detail = await getPublicBarbershop(shop.slug).catch(() => null);
                  return detail?.isBookingOpen ? shop : null;
                }),
              );
              if (active) {
                setNearbyShops(
                  bookableShops.filter((shop): shop is PublicBarbershop => shop !== null).slice(0, 3),
                );
              }
            }
          } catch (cause) {
            if (active) {
              setError(cause instanceof Error ? cause.message : 'Alternatifler yüklenemedi.');
            }
          } finally {
            if (active) setLoading(false);
          }
        })();
      }, 0);
      return () => {
        active = false;
        clearTimeout(requestId);
      };
    }, [appointment.id, appointment.serviceNameSnapshot, reloadKey, token]),
  );

  function openBooking(memberId?: string, date?: string, startsAt?: string) {
    router.push({
      pathname: '/book',
      params: {
        slug: appointment.barbershop.slug,
        attendeeSelected: '1',
        serviceId: appointment.serviceId,
        ...(appointment.dependentProfileId
          ? { dependentProfileId: appointment.dependentProfileId }
          : {}),
        ...(memberId ? { memberId } : {}),
        ...(date ? { suggestedDate: date } : {}),
        ...(startsAt ? { suggestedStartsAt: startsAt } : {}),
      },
    });
  }

  return (
    <AppCard style={styles.card}>
      <AppText variant="sectionTitle">Yeni randevu bul</AppText>
      <AppText color="textMuted" variant="bodySmall">
        Önce aynı işletmedeki uygun saatlere bakalım. Yeni randevu ancak sen son ekranda onaylarsan oluşur.
      </AppText>
      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {!isLoading && error ? (
        <View style={styles.section}>
          <AppText color="danger" variant="bodySmall">{error}</AppText>
          <AppButton onPress={() => setReloadKey((value) => value + 1)} variant="secondary">
            Tekrar Dene
          </AppButton>
        </View>
      ) : null}
      {!isLoading && !error && recovery ? (
        <View style={styles.section}>
          {recovery.options.length > 0 ? (
            <>
              <AppText variant="label">{recovery.shop.name} · önerilen saatler</AppText>
              {recovery.options.map((option) => (
                <Pressable
                  accessibilityRole="button"
                  key={`${option.memberId}-${option.startsAt}`}
                  onPress={() => openBooking(option.memberId, option.date, option.startsAt)}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <AppText variant="label">
                      {formatDate(option.date)} · {option.startTime}
                    </AppText>
                    <AppText color="textMuted" variant="bodySmall">{option.memberName}</AppText>
                  </View>
                  <AppText color="primary" variant="label">Seç →</AppText>
                </Pressable>
              ))}
              <AppText color="textMuted" variant="bodySmall">
                Saat ve güncel fiyat onay ekranında yeniden kontrol edilir.
              </AppText>
            </>
          ) : (
            <AppText color="textMuted" variant="bodySmall">
              {recovery.bookingOpen
                ? `Önümüzdeki ${recovery.searchedDays} günde bu hizmet için uygun saat bulamadık.`
                : 'Bu işletme şu anda yeni randevu kabul etmiyor.'}
            </AppText>
          )}
          {recovery.bookingOpen ? (
            <AppButton onPress={() => openBooking()} variant="secondary">
              İşletmenin Tüm Saatlerine Bak
            </AppButton>
          ) : null}
          {nearbyShops.length > 0 ? (
            <View style={styles.section}>
              <AppText variant="label">Bu işletmeye yakın alternatifler</AppText>
              {nearbyShops.map((shop) => (
                <Pressable
                  accessibilityRole="button"
                  key={shop.id}
                  onPress={() =>
                    router.push({
                      pathname: '/book',
                      params: {
                        slug: shop.slug,
                        attendeeSelected: '1',
                        ...(appointment.dependentProfileId
                          ? { dependentProfileId: appointment.dependentProfileId }
                          : {}),
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <AppText variant="label">{shop.name}</AppText>
                    <AppText color="textMuted" variant="bodySmall">
                      {shop.distanceKm === null
                        ? 'Hizmet ve saatleri gör'
                        : `${shop.distanceKm.toFixed(1)} km · Hizmet ve saatleri gör`}
                    </AppText>
                  </View>
                  <AppText color="primary" variant="label">Seç →</AppText>
                </Pressable>
              ))}
            </View>
          ) : null}
          <AppButton onPress={() => router.push('/barbers')} variant="ghost">
            Diğer İşletmelere Bak
          </AppButton>
        </View>
      ) : null}
    </AppCard>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    weekday: 'short',
  }).format(new Date(`${date}T12:00:00`));
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, marginTop: spacing.md },
  loader: { marginVertical: spacing.md },
  section: { gap: spacing.sm, marginTop: spacing.xs },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  optionCopy: { flex: 1, gap: spacing.xxs },
  pressed: { opacity: 0.75 },
});
