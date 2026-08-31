import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import {
  cancelBusinessAppointment,
  getBusinessAppointment,
  markBusinessAppointmentNoShow,
} from '@/features/appointments/api';
import type {
  AppointmentStatus,
  BusinessAppointmentDetail,
} from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessAppointmentState } from '@/features/business-appointments/components/BusinessAppointmentState';
import { formatBusinessTime } from '@/features/business-appointments/date';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { formatTurkishPrice } from '@/features/business-management/format';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const statusConfig: Record<AppointmentStatus, { color: string; label: string }> = {
  CONFIRMED: { color: '#5E8B61', label: 'Onaylandı' },
  ARRIVED: { color: colors.primary, label: 'İşlemde' },
  COMPLETED: { color: '#4F7653', label: 'Tamamlandı' },
  CANCELLED: { color: colors.danger, label: 'İptal edildi' },
  NO_SHOW: { color: '#9B6B3D', label: 'Gelmedi' },
};

export default function BusinessAppointmentDetailScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [appointment, setAppointment] = useState<BusinessAppointmentDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isUpdating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!appointmentId || !activeMembership || !token) {
      setError('Randevu bağlantısı geçersiz.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setAppointment(
        await getBusinessAppointment(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, appointmentId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  async function runAction(action: 'cancel' | 'no-show') {
    if (!appointmentId || !activeMembership || !token) return;

    setUpdating(true);
    setError(null);
    try {
      if (action === 'cancel') {
        await cancelBusinessAppointment(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        );
      } else {
        await markBusinessAppointmentNoShow(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        );
      }
      await loadAppointment();
    } catch (reason) {
      Alert.alert(
        'İşlem yapılamadı',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    } finally {
      setUpdating(false);
    }
  }

  function confirmCancellation() {
    Alert.alert(
      'Randevu iptal edilsin mi?',
      'Bu işlem müşterinin randevusunu iptal edecek.',
      [
        { style: 'cancel', text: 'Vazgeç' },
        { style: 'destructive', text: 'İptal Et', onPress: () => void runAction('cancel') },
      ],
    );
  }

  function confirmNoShow() {
    Alert.alert(
      'Müşteri gelmedi mi?',
      'Randevu gelmedi olarak kaydedilecek.',
      [
        { style: 'cancel', text: 'Vazgeç' },
        { style: 'destructive', text: 'Gelmedi', onPress: () => void runAction('no-show') },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader onBack={() => router.back()} title="Randevu Detayı" />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <BusinessAppointmentState
            description={error}
            error
            onRetry={() => void loadAppointment()}
            title="Randevu yüklenemedi"
          />
        </View>
      ) : null}

      {!isLoading && !error && appointment ? (
        <AppointmentDetailContent
          appointment={appointment}
          isUpdating={isUpdating}
          onCancel={confirmCancellation}
          onNoShow={confirmNoShow}
          onOpenCustomer={() =>
            router.push({
              pathname: '/business-customers/[customerId]',
              params: { customerId: appointment.customer.id },
            })
          }
          onOpenCamera={() =>
            router.push({
              pathname: '/business-haircut-camera/[appointmentId]',
              params: { appointmentId: appointment.id },
            })
          }
          onOpenHaircutRecord={() =>
            router.push({
              pathname: '/business-haircut-record/[appointmentId]',
              params: { appointmentId: appointment.id },
            })
          }
          onReschedule={() =>
            router.push({
              pathname: '/business-appointment-reschedule/[appointmentId]',
              params: { appointmentId: appointment.id },
            })
          }
        />
      ) : null}
    </Screen>
  );
}

function AppointmentDetailContent({
  appointment,
  isUpdating,
  onCancel,
  onNoShow,
  onOpenCustomer,
  onOpenCamera,
  onOpenHaircutRecord,
  onReschedule,
}: {
  appointment: BusinessAppointmentDetail;
  isUpdating: boolean;
  onCancel: () => void;
  onNoShow: () => void;
  onOpenCustomer: () => void;
  onOpenCamera: () => void;
  onOpenHaircutRecord: () => void;
  onReschedule: () => void;
}) {
  const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const initials = `${appointment.customer.firstName[0] ?? ''}${appointment.customer.lastName[0] ?? ''}`;
  const status = statusConfig[appointment.status];
  const date = new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'full',
    timeZone: appointment.barbershop.timezone,
  }).format(new Date(appointment.startsAt));
  const canManage = appointment.status === 'CONFIRMED' || appointment.status === 'ARRIVED';
  const canReschedule = appointment.status === 'CONFIRMED';
  const canMarkNoShow =
    appointment.status === 'CONFIRMED' && new Date() >= new Date(appointment.startsAt);
  const canComplete =
    (appointment.status === 'CONFIRMED' || appointment.status === 'ARRIVED') &&
    new Date() >= new Date(appointment.startsAt);
  const canEditRecord = appointment.status === 'COMPLETED';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Pressable
        accessibilityLabel={`${customerName} müşteri detayını aç`}
        accessibilityRole="button"
        onPress={onOpenCustomer}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <AppCard style={styles.customerCard}>
          <View style={styles.customerTopRow}>
          {appointment.customer.profileImageUrl ? (
            <Image
              accessibilityLabel={`${customerName} profil fotoğrafı`}
              contentFit="cover"
              source={appointment.customer.profileImageUrl}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText color="primary" style={styles.initials} variant="heading">
                {initials}
              </AppText>
            </View>
          )}
          <View style={styles.customerCopy}>
            <AppText style={styles.customerName} variant="heading">{customerName}</AppText>
            <AppText color="textMuted" variant="bodySmall">
              {appointment.completedVisitCount} tamamlanmış ziyaret
            </AppText>
            {appointment.customer.phone ? (
              <AppText color="textMuted" style={styles.phone} variant="bodySmall">
                {appointment.customer.phone}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}18` }]}> 
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <AppText style={[styles.statusLabel, { color: status.color }]} variant="label">
              {status.label}
            </AppText>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            tintColor={colors.textMuted}
          />
          </View>
        </AppCard>
      </Pressable>

      <AppText style={styles.sectionTitle} variant="heading">Randevu bilgileri</AppText>
      <AppCard style={styles.infoCard}>
        <DetailRow
          icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          label="Tarih"
          value={date}
        />
        <DetailRow
          icon={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
          label="Saat"
          value={`${formatBusinessTime(appointment.startsAt, appointment.barbershop.timezone)}–${formatBusinessTime(appointment.endsAt, appointment.barbershop.timezone)}`}
        />
        <DetailRow
          icon={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
          label="Hizmet"
          value={appointment.serviceNameSnapshot}
        />
        <DetailRow
          icon={{ ios: 'person', android: 'person', web: 'person' }}
          label="Çalışan"
          value={barberName}
        />
        <DetailRow
          icon={{ ios: 'hourglass', android: 'hourglass_bottom', web: 'hourglass_bottom' }}
          label="Süre"
          value={`${appointment.durationMinutes} dk`}
        />
        <DetailRow
          icon={{ ios: 'turkishlirasign.circle', android: 'payments', web: 'payments' }}
          isLast
          label="Fiyat"
          value={formatTurkishPrice(appointment.priceSnapshot)}
        />
      </AppCard>

      {appointment.cancellationReason ? (
        <AppCard style={styles.noteCard}>
          <SymbolView
            name={{ ios: 'info.circle', android: 'info', web: 'info' }}
            size={19}
            tintColor={colors.danger}
          />
          <View style={styles.noteCopy}>
            <AppText variant="label">İptal nedeni</AppText>
            <AppText color="textMuted" style={styles.noteText} variant="bodySmall">
              {appointment.cancellationReason}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {canComplete || canEditRecord ? (
        <View style={styles.recordAction}>
          <AppButton disabled={isUpdating} onPress={onOpenHaircutRecord}>
            {canEditRecord ? 'Tıraş Kaydını Düzenle' : 'Tıraşı Tamamla ve Not Ekle'}
          </AppButton>
        </View>
      ) : null}

      {canEditRecord && appointment.haircutRecord ? (
        <AppCard style={styles.photoCard}>
          <View style={styles.photoIcon}>
            <SymbolView
              name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
              size={20}
              tintColor={colors.primary}
            />
          </View>
          <View style={styles.photoCopy}>
            <AppText variant="label">Tıraş fotoğrafı</AppText>
            <AppText color="textMuted" style={styles.photoDescription} variant="bodySmall">
              Müşteri izniyle, yalnız kameradan eklenir.
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenCamera}
            style={({ pressed }) => [styles.photoButton, pressed && styles.pressed]}
          >
            <AppText color="primary" variant="label">Fotoğraf Çek</AppText>
          </Pressable>
        </AppCard>
      ) : null}

      {canManage ? (
        <View style={styles.actions}>
          {canReschedule ? (
            <AppButton disabled={isUpdating} onPress={onReschedule}>
              Yeniden Planla
            </AppButton>
          ) : null}
          {canMarkNoShow ? (
            <AppButton disabled={isUpdating} onPress={onNoShow} variant="secondary">
              Gelmedi
            </AppButton>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={isUpdating}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
              isUpdating && styles.disabled,
            ]}
          >
            <AppText color="danger" variant="label">Randevuyu İptal Et</AppText>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function DetailRow({
  icon,
  isLast = false,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  isLast?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
      <View style={styles.detailLabel}>
        <SymbolView name={icon} size={18} tintColor={colors.primary} />
        <AppText color="textMuted" style={styles.detailLabelText} variant="bodySmall">
          {label}
        </AppText>
      </View>
      <AppText numberOfLines={2} style={styles.detailValue} variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
  state: { paddingHorizontal: spacing.lg },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  customerCard: { marginTop: spacing.md, padding: spacing.md },
  pressed: { opacity: 0.65 },
  customerTopRow: { alignItems: 'center', flexDirection: 'row' },
  avatar: { borderRadius: radius.pill, height: 62, width: 62 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  initials: { fontSize: 20, lineHeight: 26 },
  customerCopy: { flex: 1, marginLeft: spacing.sm },
  customerName: { fontSize: 17, lineHeight: 23 },
  phone: { marginTop: 2 },
  statusBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: { borderRadius: radius.pill, height: 6, width: 6 },
  statusLabel: { fontSize: 11, lineHeight: 15, marginLeft: 4 },
  sectionTitle: { fontSize: 18, lineHeight: 24, marginBottom: spacing.xs, marginTop: spacing.lg },
  infoCard: { paddingBottom: 0, paddingTop: 0 },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 54,
  },
  lastDetailRow: { borderBottomWidth: 0 },
  detailLabel: { alignItems: 'center', flexDirection: 'row', width: 105 },
  detailLabelText: { marginLeft: spacing.xs },
  detailValue: { flex: 1, textAlign: 'right' },
  noteCard: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  noteCopy: { flex: 1, marginLeft: spacing.sm },
  noteText: { marginTop: 2 },
  recordAction: { marginTop: spacing.lg },
  photoCard: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.sm },
  photoIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  photoCopy: { flex: 1, marginLeft: spacing.sm },
  photoDescription: { marginTop: 2 },
  photoButton: { paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  actions: { gap: spacing.xs, marginTop: spacing.lg },
  cancelButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  disabled: { opacity: 0.45 },
});
