import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { cancelMyAppointment, getMyAppointment } from '@/features/appointments/api';
import type {
  AppointmentStatus,
  CustomerAppointment,
} from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const statusLabels: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Onaylandı',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal edildi',
  NO_SHOW: 'Gelinmedi',
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!token || !appointmentId) {
      setError('Randevu bağlantısı geçersiz.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setAppointment(await getMyAppointment(appointmentId, token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu yüklenemedi.');
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, token]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadAppointment(), 0);
    return () => clearTimeout(requestId);
  }, [loadAppointment]);

  function requestCancellation() {
    if (!appointment?.canCancel || isCancelling) return;

    Alert.alert(
      'Randevuyu iptal et',
      'Bu işlemden sonra seçtiğin saat yeniden başkalarına açılacak. Emin misin?',
      [
        { style: 'cancel', text: 'Vazgeç' },
        {
          onPress: () => void cancelAppointment(),
          style: 'destructive',
          text: 'İptal Et',
        },
      ],
    );
  }

  async function cancelAppointment() {
    if (!token || !appointmentId) return;

    setIsCancelling(true);
    setError(null);

    try {
      await cancelMyAppointment(appointmentId, token);
      await loadAppointment();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu iptal edilemedi.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <AppIconButton
          accessibilityLabel="Geri dön"
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          onPress={() => router.back()}
        />
        <AppText variant="heading">Randevu Detayı</AppText>
        <View style={styles.topBarSpacer} />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error && !appointment ? (
        <View style={styles.errorState}>
          <AppText color="danger" variant="heading">Randevu yüklenemedi</AppText>
          <AppText color="textMuted" style={styles.centerText}>{error}</AppText>
          <View style={styles.retryButton}>
            <AppButton onPress={() => void loadAppointment()} variant="secondary">Tekrar Dene</AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && appointment ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppointmentSummary appointment={appointment} />

          <AppText style={styles.sectionTitle} variant="heading">Randevu Bilgileri</AppText>
          <AppCard style={styles.detailCard}>
            <DetailRow
              icon={{ ios: 'person', android: 'person', web: 'person' }}
              label="Berber"
              value={`${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`}
            />
            <DetailRow
              icon={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              label="Hizmet"
              value={appointment.serviceNameSnapshot}
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
              value={`₺${formatPrice(appointment.priceSnapshot)}`}
            />
          </AppCard>

          <AppCard style={styles.policyCard}>
            <SymbolView
              name={{ ios: 'info.circle', android: 'info_outline', web: 'info_outline' }}
              size={21}
              tintColor={appointment.canCancel ? colors.primary : colors.textMuted}
            />
            <View style={styles.policyText}>
              <AppText variant="label">İptal Koşulu</AppText>
              <AppText color="textMuted" style={styles.policyDescription} variant="bodySmall">
                {getCancellationMessage(appointment)}
              </AppText>
            </View>
          </AppCard>

          {error ? (
            <View style={styles.inlineError}>
              <AppText color="danger" variant="bodySmall">{error}</AppText>
            </View>
          ) : null}

          {appointment.canCancel ? (
            <Pressable
              accessibilityRole="button"
              disabled={isCancelling}
              onPress={requestCancellation}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
                isCancelling && styles.disabled,
              ]}>
              <SymbolView
                name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
                size={18}
                tintColor={colors.danger}
              />
              <AppText color="danger" variant="label">
                {isCancelling ? 'İptal ediliyor…' : 'Randevuyu İptal Et'}
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function AppointmentSummary({ appointment }: { appointment: CustomerAppointment }) {
  const startsAt = new Date(appointment.startsAt);
  const isCancelled = appointment.status === 'CANCELLED';

  return (
    <AppCard style={styles.summaryCard}>
      <View style={styles.dateBox}>
        <AppText color="onPrimary" variant="bodySmall">
          {new Intl.DateTimeFormat('tr-TR', { weekday: 'short' }).format(startsAt).replace('.', '')}
        </AppText>
        <AppText color="onPrimary" style={styles.dayNumber} variant="displayMedium">
          {new Intl.DateTimeFormat('tr-TR', { day: '2-digit' }).format(startsAt)}
        </AppText>
        <AppText color="onPrimary" variant="bodySmall">
          {new Intl.DateTimeFormat('tr-TR', { month: 'short' }).format(startsAt).replace('.', '')}
        </AppText>
      </View>
      <View style={styles.summaryContent}>
        <AppText variant="displayMedium">{appointment.barbershop.name}</AppText>
        <AppText color="textMuted" style={styles.summaryMeta}>
          {formatDateTime(appointment.startsAt)}
        </AppText>
        <View style={[styles.statusBadge, isCancelled && styles.cancelledBadge]}>
          <AppText color={isCancelled ? 'danger' : 'textMuted'} variant="bodySmall">
            {statusLabels[appointment.status]}
          </AppText>
        </View>
      </View>
    </AppCard>
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
    <View style={[styles.detailRow, !isLast && styles.detailDivider]}>
      <View style={styles.detailLabel}>
        <SymbolView name={icon} size={17} tintColor={colors.primary} />
        <AppText color="textMuted" variant="bodySmall">{label}</AppText>
      </View>
      <AppText numberOfLines={2} style={styles.detailValue} variant="label">{value}</AppText>
    </View>
  );
}

function getCancellationMessage(appointment: CustomerAppointment) {
  if (appointment.cancellationReason) return appointment.cancellationReason;

  const notice = formatNotice(appointment.cancellationNoticeMinutes);
  const deadline = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
  }).format(new Date(appointment.cancellationDeadline));

  return `Randevuyu ${notice} öncesine kadar iptal edebilirsin. Son iptal zamanı: ${deadline}.`;
}

function formatNotice(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} saat`;
  return `${minutes} dakika`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    weekday: 'long',
  }).format(new Date(value));
}

function formatPrice(price: string) {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice)
    ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(numericPrice)
    : price;
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  topBarSpacer: { width: 44 },
  loader: { marginTop: spacing.xxxl },
  errorState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  centerText: { marginTop: spacing.xs, textAlign: 'center' },
  retryButton: { marginTop: spacing.xl, minWidth: 180 },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  summaryCard: { alignItems: 'center', flexDirection: 'row', padding: spacing.sm },
  dateBox: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 94,
    width: 72,
  },
  dayNumber: { fontSize: 27, lineHeight: 31 },
  summaryContent: { flex: 1, marginLeft: spacing.md },
  summaryMeta: { marginTop: spacing.xs, textTransform: 'capitalize' },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  cancelledBadge: { backgroundColor: '#F8E8E5' },
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  detailCard: { paddingVertical: spacing.xs },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingVertical: spacing.xs,
  },
  detailDivider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  detailLabel: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  detailValue: { flex: 1, marginLeft: spacing.md, textAlign: 'right' },
  policyCard: { alignItems: 'flex-start', flexDirection: 'row', marginTop: spacing.lg },
  policyText: { flex: 1, marginLeft: spacing.sm },
  policyDescription: { marginTop: spacing.xxs },
  inlineError: {
    backgroundColor: '#F8E8E5',
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xl,
    minHeight: 50,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
