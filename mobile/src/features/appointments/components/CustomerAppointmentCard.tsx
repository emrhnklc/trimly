import { StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type {
  AppointmentStatus,
  CustomerAppointment,
} from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const statusLabels: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  NO_SHOW: 'Gelinmedi',
};

export function CustomerAppointmentCard({ appointment }: { appointment: CustomerAppointment }) {
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
  const isCancelled = appointment.status === 'CANCELLED';

  return (
    <AppCard style={styles.card}>
      <View style={styles.dateBox}>
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
        <View style={styles.headingRow}>
          <AppText numberOfLines={1} style={styles.shopName} variant="label">
            {appointment.barbershop.name}
          </AppText>
          <View style={[styles.badge, isCancelled && styles.cancelledBadge]}>
            <AppText color={isCancelled ? 'danger' : 'textMuted'} style={styles.badgeText} variant="bodySmall">
              {statusLabels[appointment.status]}
            </AppText>
          </View>
        </View>

        <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
          {barberName}
        </AppText>
        <View style={styles.metaRow}>
          <SymbolView
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            size={15}
            tintColor={colors.textMuted}
          />
          <AppText color="textMuted" variant="bodySmall">{timeLabel}</AppText>
          <View style={styles.dot} />
          <AppText color="textMuted" numberOfLines={1} style={styles.serviceName} variant="bodySmall">
            {appointment.serviceNameSnapshot}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'stretch', flexDirection: 'row', marginBottom: spacing.sm, padding: spacing.sm },
  dateBox: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 82,
    width: 62,
  },
  dateText: { fontSize: 11, lineHeight: 14, textTransform: 'capitalize' },
  dayNumber: { fontSize: 24, lineHeight: 28 },
  content: { flex: 1, justifyContent: 'center', marginLeft: spacing.sm },
  headingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  shopName: { flex: 1 },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  cancelledBadge: { backgroundColor: '#F8E8E5' },
  badgeText: { fontSize: 10, lineHeight: 14 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  dot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 4, width: 4 },
  serviceName: { flex: 1 },
});
