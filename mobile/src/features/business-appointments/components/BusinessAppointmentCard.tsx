import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { BusinessAppointment } from '@/features/appointments/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { formatBusinessTime } from '../date';

export function BusinessAppointmentCard({
  appointment,
  onPress,
  timeZone,
}: {
  appointment: BusinessAppointment;
  onPress?: () => void;
  timeZone: string;
}) {
  const themeColors = useThemeColors();
  const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const initials = `${appointment.customer.firstName[0] ?? ''}${appointment.customer.lastName[0] ?? ''}`;
  const status: { backgroundColor: string; color: string; label: string } = {
    CONFIRMED: { backgroundColor: themeColors.successSurface, color: themeColors.success, label: 'Onaylandı' },
    ARRIVED: { backgroundColor: themeColors.infoSurface, color: themeColors.info, label: 'Geldi' },
    COMPLETED: { backgroundColor: themeColors.surfaceMuted, color: themeColors.textMuted, label: 'Tamamlandı' },
    CANCELLED: { backgroundColor: themeColors.dangerSurface, color: themeColors.danger, label: 'İptal' },
    NO_SHOW: { backgroundColor: themeColors.surfaceMuted, color: themeColors.textMuted, label: 'Gelmedi' },
  }[appointment.status];

  const content = (
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
        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: themeColors.surfaceMuted }]}>
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

      <View style={[styles.status, { backgroundColor: status.backgroundColor }]}>
        <AppText style={[styles.statusLabel, { color: status.color }]} variant="bodySmall">
          {status.label}
        </AppText>
      </View>
    </AppCard>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityLabel={`${customerName} randevu detayını aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 92,
    padding: spacing.sm,
  },
  timeColumn: { alignItems: 'center', width: 52 },
  time: { fontSize: 12, lineHeight: 16 },
  duration: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  avatar: { borderRadius: radius.pill, height: 44, width: 44 },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  customerName: { fontSize: 14, lineHeight: 19 },
  service: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  barber: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  status: {
    alignItems: 'center',
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusLabel: { fontSize: 9, lineHeight: 12 },
  pressed: { opacity: 0.68 },
});
