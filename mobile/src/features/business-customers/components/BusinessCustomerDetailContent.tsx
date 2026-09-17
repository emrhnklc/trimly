import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { formatBusinessTime } from '@/features/business-appointments/date';
import type {
  BusinessCustomerDetail,
  BusinessCustomerVisit,
} from '@/features/business-customers/types';
import { formatTurkishPrice } from '@/features/business-management/format';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BusinessCustomerDetailContentProps = {
  customer: BusinessCustomerDetail;
  onOpenAppointment: (appointmentId: string) => void;
  timeZone: string;
};

export function BusinessCustomerDetailContent({
  customer,
  onOpenAppointment,
  timeZone,
}: BusinessCustomerDetailContentProps) {
  const themeColors = useThemeColors();
  if (!customer) return null;

  const fullName = `${customer.firstName} ${customer.lastName}`;
  const initials = `${customer.firstName[0] ?? ''}${customer.lastName[0] ?? ''}`;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppCard style={styles.profileCard}>
        {customer.profileImageUrl ? (
          <Image
            accessibilityLabel={`${fullName} profil fotoğrafı`}
            contentFit="cover"
            source={customer.profileImageUrl}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: themeColors.surfaceMuted },
            ]}>
            <AppText color="primary" style={styles.initials} variant="heading">
              {initials}
            </AppText>
          </View>
        )}
        <View style={styles.profileCopy}>
          <AppText style={styles.customerName} variant="heading">{fullName}</AppText>
          {customer.phone ? (
            <AppText color="textMuted" style={styles.phone} variant="bodySmall">
              {customer.phone}
            </AppText>
          ) : null}
        </View>
        <View style={styles.visitCount}>
          <AppText color="primary" style={styles.visitCountNumber} variant="heading">
            {customer.completedVisitCount}
          </AppText>
          <AppText color="textMuted" style={styles.visitCountLabel} variant="bodySmall">
            ziyaret
          </AppText>
        </View>
      </AppCard>

      <View style={styles.sectionHeading}>
        <AppText style={styles.sectionTitle} variant="heading">Ziyaret geçmişi</AppText>
        <AppText color="textMuted" variant="bodySmall">
          {customer.totalAppointmentCount} randevu
        </AppText>
      </View>

      {customer.appointments.map((appointment) => (
        <BusinessCustomerVisitCard
          appointment={appointment}
          key={appointment.id}
          onPress={() => onOpenAppointment(appointment.id)}
          timeZone={timeZone}
        />
      ))}
    </ScrollView>
  );
}

function BusinessCustomerVisitCard({
  appointment,
  onPress,
  timeZone,
}: {
  appointment: BusinessCustomerVisit;
  onPress: () => void;
  timeZone: string;
}) {
  const themeColors = useThemeColors();
  const status: { color: string; label: string } = {
    CONFIRMED: { color: themeColors.success, label: 'Yaklaşan' },
    ARRIVED: { color: themeColors.info, label: 'Geldi' },
    COMPLETED: { color: themeColors.textMuted, label: 'Tamamlandı' },
    CANCELLED: { color: themeColors.danger, label: 'İptal' },
    NO_SHOW: { color: themeColors.primaryPressed, label: 'Gelmedi' },
  }[appointment.status];
  const employeeName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const date = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(new Date(appointment.startsAt));

  return (
    <Pressable
      accessibilityLabel={`${date} tarihli randevu detayını aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <AppCard style={styles.visitCard}>
        <View style={styles.visitTopRow}>
          <View>
            <AppText style={styles.visitDate} variant="label">{date}</AppText>
            <AppText color="textMuted" style={styles.visitTime} variant="bodySmall">
              {formatBusinessTime(appointment.startsAt, timeZone)} · {employeeName}
            </AppText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}>
            <AppText style={[styles.statusText, { color: status.color }]} variant="label">
              {status.label}
            </AppText>
          </View>
        </View>

        <View style={[styles.serviceRow, { borderTopColor: themeColors.border }]}>
          <View style={styles.serviceCopy}>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={16}
              tintColor={themeColors.primary}
            />
            <AppText style={styles.serviceName} variant="label">
              {appointment.serviceNameSnapshot}
            </AppText>
          </View>
          <AppText variant="label">{formatTurkishPrice(appointment.priceSnapshot)}</AppText>
        </View>

        {appointment.haircutRecord?.styleName || appointment.haircutRecord?.notes ? (
          <View style={[styles.recordBox, { backgroundColor: themeColors.surfaceMuted }]}>
            {appointment.haircutRecord.styleName ? (
              <RecordRow
                icon={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                label="Model"
                value={appointment.haircutRecord.styleName}
              />
            ) : null}
            {appointment.haircutRecord.notes ? (
              <RecordRow
                icon={{ ios: 'note.text', android: 'notes', web: 'notes' }}
                label="Not"
                value={appointment.haircutRecord.notes}
              />
            ) : null}
          </View>
        ) : null}
      </AppCard>
    </Pressable>
  );
}

function RecordRow({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.recordRow}>
      <SymbolView name={icon} size={14} tintColor={themeColors.primary} />
      <AppText color="textMuted" style={styles.recordLabel} variant="bodySmall">
        {label}:
      </AppText>
      <AppText numberOfLines={2} style={styles.recordValue} variant="bodySmall">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  avatar: { borderRadius: radius.pill, height: 64, width: 64 },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 20, lineHeight: 26 },
  profileCopy: { flex: 1, marginLeft: spacing.sm },
  customerName: { fontSize: 18, lineHeight: 24 },
  phone: { marginTop: 3 },
  visitCount: { alignItems: 'center', marginLeft: spacing.sm },
  visitCountNumber: { fontSize: 21, lineHeight: 26 },
  visitCountLabel: { fontSize: 10, lineHeight: 14 },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  visitCard: { marginBottom: spacing.sm, padding: spacing.md },
  pressed: { opacity: 0.65 },
  visitTopRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  visitDate: { fontSize: 14, lineHeight: 19 },
  visitTime: { marginTop: 2 },
  statusBadge: {
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  statusText: { fontSize: 9, lineHeight: 12 },
  serviceRow: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
  },
  serviceCopy: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  serviceName: { marginLeft: spacing.xs },
  recordBox: {
    borderRadius: radius.md,
    gap: 5,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  recordRow: { alignItems: 'flex-start', flexDirection: 'row' },
  recordLabel: { marginLeft: 5 },
  recordValue: { flex: 1, marginLeft: 4 },
});
