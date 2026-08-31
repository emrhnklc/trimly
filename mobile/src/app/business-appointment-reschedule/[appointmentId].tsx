import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import {
  getBusinessAppointment,
  rescheduleBusinessAppointment,
} from '@/features/appointments/api';
import { BookingTimePicker } from '@/features/appointments/components/BookingTimePicker';
import type { BusinessAppointmentDetail } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { getAvailability } from '@/features/barbershops/api';
import type { AvailabilitySlot } from '@/features/barbershops/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { getDateKey } from '@/features/business-appointments/date';
import { DatePickerModal } from '@/features/business-hours/components/DatePickerModal';
import { formatDateKey } from '@/features/business-hours/date';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function BusinessAppointmentRescheduleScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [appointment, setAppointment] = useState<BusinessAppointmentDetail | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isLoadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeZone = activeMembership?.barbershop.timezone ?? 'Europe/Istanbul';
  const today = getDateKey(new Date(), timeZone);

  const loadSlots = useCallback(
    async (nextAppointment: BusinessAppointmentDetail, nextDate: string) => {
      setLoadingSlots(true);
      setError(null);
      setSelectedHour(null);
      setSelectedSlot(null);

      try {
        const result = await getAvailability(
          nextAppointment.barbershop.id,
          nextAppointment.businessMember.id,
          nextAppointment.serviceId,
          nextDate,
        );
        setSlots(result.slots);
      } catch (reason) {
        setSlots([]);
        setError(reason instanceof Error ? reason.message : 'Uygun saatler yüklenemedi.');
      } finally {
        setLoadingSlots(false);
      }
    },
    [],
  );

  const loadAppointment = useCallback(async () => {
    if (!appointmentId || !activeMembership || !token) {
      setError('Randevu bağlantısı geçersiz.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getBusinessAppointment(
        activeMembership.barbershop.id,
        appointmentId,
        token,
      );
      const appointmentDate = getDateKey(new Date(result.startsAt), result.barbershop.timezone);
      const initialDate = appointmentDate < today ? today : appointmentDate;
      setAppointment(result);
      setDate(initialDate);
      await loadSlots(result, initialDate);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, appointmentId, loadSlots, today, token]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  async function submit() {
    if (!appointment || !appointmentId || !token || !selectedSlot) return;

    setSubmitting(true);
    setError(null);
    try {
      await rescheduleBusinessAppointment(
        appointment.barbershop.id,
        appointmentId,
        selectedSlot.startsAt,
        token,
      );
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu yeniden planlanamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader onBack={() => router.back()} title="Yeniden Planla" />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && appointment ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppCard style={styles.summaryCard}>
            <AppText color="textMuted" variant="bodySmall">Randevu</AppText>
            <AppText style={styles.customerName} variant="heading">
              {appointment.customer.firstName} {appointment.customer.lastName}
            </AppText>
            <AppText color="textMuted" style={styles.serviceName} variant="bodySmall">
              {appointment.serviceNameSnapshot} · {appointment.durationMinutes} dk
            </AppText>
          </AppCard>

          <AppText style={styles.sectionTitle} variant="heading">Yeni tarih</AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
          >
            <SymbolView
              name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
              size={19}
              tintColor={colors.primary}
            />
            <AppText style={styles.dateLabel} variant="label">
              {date ? formatDateKey(date) : 'Tarih seç'}
            </AppText>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={15}
              tintColor={colors.textMuted}
            />
          </Pressable>

          <AppText style={styles.sectionTitle} variant="heading">Yeni saat</AppText>
          {isLoadingSlots ? (
            <ActivityIndicator color={colors.primary} style={styles.slotLoader} />
          ) : (
            <BookingTimePicker
              onHourSelect={setSelectedHour}
              onSlotSelect={setSelectedSlot}
              selectedHour={selectedHour}
              selectedStartsAt={selectedSlot?.startsAt ?? null}
              slots={slots}
            />
          )}

          {error ? (
            <View style={styles.errorBox}>
              <AppText color="danger" variant="bodySmall">{error}</AppText>
            </View>
          ) : null}

          <View style={styles.submitButton}>
            <AppButton
              disabled={!selectedSlot || isSubmitting}
              onPress={() => void submit()}
            >
              {isSubmitting ? 'Güncelleniyor…' : 'Yeni Saati Onayla'}
            </AppButton>
          </View>
        </ScrollView>
      ) : null}

      {showDatePicker && date ? (
        <DatePickerModal
          label="Yeni randevu tarihi"
          minDate={today}
          onClose={() => setShowDatePicker(false)}
          onSelect={(value) => {
            setDate(value);
            setShowDatePicker(false);
            if (appointment) void loadSlots(appointment, value);
          }}
          value={date}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  summaryCard: { marginTop: spacing.md, padding: spacing.md },
  customerName: { fontSize: 18, lineHeight: 24, marginTop: 2 },
  serviceName: { marginTop: 3 },
  sectionTitle: { fontSize: 17, lineHeight: 23, marginBottom: spacing.xs, marginTop: spacing.lg },
  dateButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  dateLabel: { flex: 1, marginLeft: spacing.sm },
  pressed: { opacity: 0.65 },
  slotLoader: { marginVertical: spacing.lg },
  errorBox: {
    backgroundColor: '#F8E8E5',
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  submitButton: { marginTop: spacing.xl },
});
