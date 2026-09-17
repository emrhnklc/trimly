import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type { CustomerAppointment } from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function NextAppointmentCard({
  appointment,
  onPress,
}: {
  appointment: CustomerAppointment | null;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
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
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconBox, { backgroundColor: themeColors.surfaceMuted }]}>
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
        <AppText color="textMuted" numberOfLines={2} style={styles.meta} variant="bodySmall">
          {appointment ? `${dateLabel} · ${appointment.serviceNameSnapshot}` : 'Sana uygun işletme ve saati keşfet.'}
        </AppText>
      </View>
      <View style={[styles.detailPill, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
        <AppText color="primary" variant="bodySmall">{appointment ? 'Detay' : 'Planla'}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    minHeight: 84,
    padding: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  iconBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: { flex: 1, marginHorizontal: spacing.sm },
  eyebrow: { fontSize: 9, lineHeight: 12 },
  meta: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  detailPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
