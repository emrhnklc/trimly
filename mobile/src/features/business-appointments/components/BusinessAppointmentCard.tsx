import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { AppointmentStatus, BusinessAppointment } from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatBusinessTime } from '../date';

const statusConfig: Record<AppointmentStatus, { color: string; label: string }> = {
  CONFIRMED: { color: '#5E8B61', label: 'Onaylandı' },
  COMPLETED: { color: colors.primary, label: 'Tamamlandı' },
  CANCELLED: { color: colors.danger, label: 'İptal' },
  NO_SHOW: { color: '#9B6B3D', label: 'Gelmedi' },
};

export function BusinessAppointmentCard({
  appointment,
  timeZone,
}: {
  appointment: BusinessAppointment;
  timeZone: string;
}) {
  const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const initials = `${appointment.customer.firstName[0] ?? ''}${appointment.customer.lastName[0] ?? ''}`;
  const status = statusConfig[appointment.status];

  return (
    <AppCard style={styles.card}>
      <View style={styles.timeColumn}>
        <AppText style={styles.time} variant="label">
          {formatBusinessTime(appointment.startsAt, timeZone)}
        </AppText>
        <AppText color="textMuted" style={styles.duration} variant="bodySmall">
          {appointment.durationMinutes} dk
        </AppText>
      </View>

      {appointment.customer.profileImageUrl ? (
        <Image
          accessibilityLabel={`${customerName} profil fotoğrafı`}
          contentFit="cover"
          source={appointment.customer.profileImageUrl}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <AppText color="primary" variant="label">{initials}</AppText>
        </View>
      )}

      <View style={styles.details}>
        <AppText numberOfLines={1} style={styles.customerName} variant="label">
          {customerName}
        </AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.service} variant="bodySmall">
          {appointment.serviceNameSnapshot}
        </AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.barber} variant="bodySmall">
          Berber: {barberName}
        </AppText>
      </View>

      <View style={styles.status}>
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <AppText style={[styles.statusLabel, { color: status.color }]} variant="bodySmall">
          {status.label}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 88,
    padding: spacing.sm,
  },
  timeColumn: { alignItems: 'center', width: 52 },
  time: { fontSize: 12, lineHeight: 16 },
  duration: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  avatar: { borderRadius: radius.pill, height: 44, width: 44 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  details: { flex: 1, marginLeft: spacing.sm },
  customerName: { fontSize: 13, lineHeight: 18 },
  service: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  barber: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  status: { alignItems: 'center', flexDirection: 'row', marginLeft: spacing.xs },
  statusDot: { borderRadius: radius.pill, height: 6, width: 6 },
  statusLabel: { fontSize: 9, lineHeight: 13, marginLeft: 3 },
});
