import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type { CustomerAppointment } from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function NextAppointmentCard({
  appointment,
  onPress,
}: {
  appointment: CustomerAppointment | null;
  onPress: () => void;
}) {
  const startsAt = appointment ? new Date(appointment.startsAt) : null;
  const dateLabel = startsAt
    ? new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        month: 'long',
        weekday: 'short',
      }).format(startsAt)
    : null;

  return (
    <Pressable
      accessibilityLabel={appointment ? 'Sonraki randevunun detaylarını aç' : 'Randevu oluştur'}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        <SymbolView
          name={{ ios: 'calendar.badge.clock', android: 'event', web: 'event' }}
          size={24}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.content}>
        <AppText color="primary" style={styles.eyebrow} variant="overline">
          {appointment ? 'SONRAKİ RANDEVUN' : 'RANDEVU PLANI'}
        </AppText>
        <AppText numberOfLines={1} variant="label">
          {appointment?.barbershop.name ?? 'Henüz yaklaşan randevun yok'}
        </AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.meta} variant="bodySmall">
          {appointment ? `${dateLabel} · ${appointment.serviceNameSnapshot}` : 'Sana uygun işletme ve saati keşfet.'}
        </AppText>
      </View>
      <View style={styles.detailPill}>
        <AppText color="primary" variant="bodySmall">{appointment ? 'Detay' : 'Planla'}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 252, 247, 0.68)',
    borderColor: 'rgba(184, 134, 11, 0.18)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    minHeight: 74,
    padding: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: { flex: 1, marginHorizontal: spacing.sm },
  eyebrow: { fontSize: 9, lineHeight: 12 },
  meta: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  detailPill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
