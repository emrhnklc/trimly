import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type {
  AppointmentStatus,
  CustomerAppointment,
} from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

const statusLabels: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Onaylandı',
  ARRIVED: 'Geldi',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
  NO_SHOW: 'Gelmedi',
};

export function CustomerAppointmentCard({
  appointment,
  onPress,
}: {
  appointment: CustomerAppointment;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
  const startsAt = new Date(appointment.startsAt);
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const dayLabel = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' })
    .format(startsAt)
    .replace('.', '');
  const dayNumber = new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(startsAt);
  const monthLabel = new Intl.DateTimeFormat('tr-TR', { month: 'short' })
    .format(startsAt)
    .replace('.', '');
  const timeLabel = new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(startsAt);
  const presentationByStatus: Record<
    AppointmentStatus,
    { backgroundColor: string; color: keyof typeof colors }
  > = {
    CONFIRMED: { backgroundColor: themeColors.successSurface, color: 'success' },
    ARRIVED: { backgroundColor: themeColors.surfaceMuted, color: 'primary' },
    COMPLETED: { backgroundColor: themeColors.surfaceMuted, color: 'textMuted' },
    CANCELLED: { backgroundColor: themeColors.dangerSurface, color: 'danger' },
    NO_SHOW: { backgroundColor: themeColors.dangerSurface, color: 'danger' },
  };
  const presentation = presentationByStatus[appointment.status];

  return (
    <Pressable
      accessibilityLabel={`${appointment.barbershop.name} randevu detayını aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        <View style={[styles.dateBox, { backgroundColor: themeColors.darkSurface }]}>
          <AppText color="onPrimary" style={styles.dateText} variant="bodySmall">
            {dayLabel}
          </AppText>
          <AppText color="onPrimary" style={styles.dayNumber} variant="displayMedium">
            {dayNumber}
          </AppText>
          <AppText color="onPrimary" style={styles.dateText} variant="bodySmall">
            {monthLabel}
          </AppText>
        </View>

        <View style={styles.content}>
          <AppText numberOfLines={1} style={styles.shopName} variant="cardTitle">
            {appointment.barbershop.name}
          </AppText>
          <AppText color="textMuted" numberOfLines={1} style={styles.employee} variant="bodySmall">
            {barberName}
          </AppText>
          <View style={styles.metaRow}>
            <SymbolView
              name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
              size={15}
              tintColor={themeColors.textMuted}
            />
            <AppText color="textMuted" variant="bodySmall">{timeLabel}</AppText>
            <View style={styles.dot} />
            <AppText color="textMuted" numberOfLines={1} style={styles.serviceName} variant="bodySmall">
              {appointment.serviceNameSnapshot}
            </AppText>
          </View>
        </View>
        <View style={styles.trailing}>
          <View style={[styles.badge, { backgroundColor: presentation.backgroundColor }]}>
            <AppText color={presentation.color} numberOfLines={1} style={styles.badgeText} variant="bodySmall">
              {statusLabels[appointment.status]}
            </AppText>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={13}
            tintColor={themeColors.textMuted}
          />
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  card: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm, padding: spacing.sm },
  dateBox: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 80,
    width: 58,
  },
  dateText: { fontSize: 11, lineHeight: 14, textTransform: 'capitalize' },
  dayNumber: { fontSize: 24, lineHeight: 28 },
  content: { flex: 1, justifyContent: 'center', marginLeft: 10, minWidth: 0 },
  shopName: { flex: 1 },
  employee: { marginTop: 2 },
  trailing: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    marginLeft: 6,
    paddingVertical: 5,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    minHeight: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, lineHeight: 14 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  dot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 4, width: 4 },
  serviceName: { flex: 1 },
});
