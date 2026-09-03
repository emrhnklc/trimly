import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import type { BusinessAppointment } from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatBusinessTime } from '../date';

function getMinutesUntilArrivalOpens(appointment: BusinessAppointment, now: number) {
  const opensAt = new Date(appointment.startsAt).getTime();
  return Math.max(0, Math.ceil((opensAt - now) / 60000));
}

function getCardState(appointment: BusinessAppointment, now: number) {
  const startsAt = new Date(appointment.startsAt).getTime();
  const endsAt = new Date(appointment.endsAt).getTime();

  if (appointment.status === 'ARRIVED') {
    return {
      accent: '#D5A538',
      label: now >= startsAt ? 'İŞLEMDE' : 'MÜŞTERİ GELDİ',
      note: appointment.autoCompleteAt
        ? `${formatBusinessTime(appointment.autoCompleteAt, 'Europe/Istanbul')} civarı otomatik tamamlanır`
        : 'Geliş kaydı oluşturuldu',
    };
  }

  if (now > endsAt) {
    const minutesUntilAutomaticCompletion = Math.max(
      0,
      Math.ceil((endsAt + 60 * 60 * 1000 - now) / 60000),
    );

    return {
      accent: '#9B6B3D',
      label: 'GECİKEN RANDEVU',
      note:
        minutesUntilAutomaticCompletion > 0
          ? `Müşteri geldiyse işaretle; aksi halde ${minutesUntilAutomaticCompletion} dk sonra otomatik tamamlanır.`
          : 'Randevu otomatik tamamlanıyor.',
    };
  }

  if (now >= startsAt) {
    return {
      accent: '#5E8B61',
      label: 'SIRADAKİ MÜŞTERİ',
      note: now >= startsAt ? 'Randevu saati geldi.' : 'Geliş kaydı açıldı.',
    };
  }

  const minutes = getMinutesUntilArrivalOpens(appointment, now);
  return {
    accent: colors.primary,
    label: 'SIRADAKİ RANDEVU',
    note: `“Müşteri Geldi” ${minutes} dk sonra açılacak.`,
  };
}

export function BusinessActiveAppointmentCard({
  appointment,
  isSubmitting,
  now,
  onArrive,
  onCancel,
  onDetail,
  onUndoArrival,
  timeZone,
}: {
  appointment: BusinessAppointment;
  isSubmitting: boolean;
  now: number;
  onArrive: () => void;
  onCancel: () => void;
  onDetail: () => void;
  onUndoArrival: () => void;
  timeZone: string;
}) {
  const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const initials = `${appointment.customer.firstName[0] ?? ''}${appointment.customer.lastName[0] ?? ''}`;
  const state = getCardState(appointment, now);
  const canMarkArrived = getMinutesUntilArrivalOpens(appointment, now) === 0;
  const hasArrived = appointment.status === 'ARRIVED';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: state.accent }]} />
          <AppText style={[styles.overline, { color: state.accent }]} variant="overline">
            {state.label}
          </AppText>
        </View>
        <View style={styles.timeBadge}>
          <SymbolView
            name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            size={15}
            tintColor={colors.primary}
          />
          <AppText color="primary" style={styles.time} variant="label">
            {formatBusinessTime(appointment.startsAt, timeZone)}–
            {formatBusinessTime(appointment.endsAt, timeZone)}
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityLabel={`${customerName} randevu detayını aç`}
        accessibilityRole="button"
        onPress={onDetail}
        style={({ pressed }) => [styles.customerRow, pressed && styles.pressed]}>
        {appointment.customer.profileImageUrl ? (
          <Image
            accessibilityLabel={`${customerName} profil fotoğrafı`}
            contentFit="cover"
            source={appointment.customer.profileImageUrl}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <AppText color="primary" style={styles.initials} variant="heading">{initials}</AppText>
          </View>
        )}
        <View style={styles.customerCopy}>
          <AppText numberOfLines={1} style={styles.customerName} variant="heading">
            {customerName}
          </AppText>
          <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
            {appointment.serviceNameSnapshot} · {appointment.durationMinutes} dk
          </AppText>
          <AppText color="textMuted" numberOfLines={1} style={styles.barber} variant="bodySmall">
            {barberName} ile
          </AppText>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
          tintColor={colors.textMuted}
        />
      </Pressable>

      <View style={styles.infoRow}>
        <SymbolView
          name={{ ios: 'info.circle', android: 'info', web: 'info' }}
          size={16}
          tintColor={state.accent}
        />
        <AppText color="textMuted" style={styles.note} variant="bodySmall">
          {hasArrived && appointment.autoCompleteAt
            ? `${formatBusinessTime(appointment.autoCompleteAt, timeZone)} civarı otomatik tamamlanır.`
            : state.note}
        </AppText>
      </View>

      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <AppButton
            disabled={isSubmitting || (!hasArrived && !canMarkArrived)}
            onPress={hasArrived ? onUndoArrival : onArrive}
            variant={hasArrived ? 'secondary' : 'primary'}>
            {isSubmitting
              ? 'Güncelleniyor...'
              : hasArrived
                ? 'Gelişi Geri Al'
                : 'Müşteri Geldi'}
          </AppButton>
        </View>
        <View style={styles.cancelAction}>
          <AppButton disabled={isSubmitting} onPress={onCancel} variant="ghost">
            İptal Et
          </AppButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: 'hidden',
    padding: spacing.md,
  },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  statusRow: { alignItems: 'center', flexDirection: 'row' },
  statusDot: { borderRadius: radius.pill, height: 7, marginRight: 6, width: 7 },
  overline: { fontSize: 9, lineHeight: 13 },
  timeBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  time: { fontSize: 11, lineHeight: 15, marginLeft: 5 },
  customerRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  avatar: { borderRadius: radius.pill, height: 62, width: 62 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  initials: { fontSize: 20, lineHeight: 26 },
  customerCopy: { flex: 1, marginLeft: spacing.md },
  customerName: { fontSize: 18, lineHeight: 24 },
  barber: { marginTop: 2 },
  infoRow: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  note: { flex: 1, marginLeft: spacing.xs },
  actions: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm },
  primaryAction: { flex: 1 },
  cancelAction: { marginLeft: spacing.xs, minWidth: 82 },
  pressed: { opacity: 0.68 },
});
