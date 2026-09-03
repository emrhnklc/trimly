import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import {
  completeBusinessAppointment,
  getBusinessAppointment,
} from '@/features/appointments/api';
import type { BusinessAppointmentDetail } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { saveBusinessHaircutRecord } from '@/features/haircut-history/api';
import { BusinessHaircutRecordForm } from '@/features/haircut-history/components/BusinessHaircutRecordForm';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BusinessHaircutRecordScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [appointment, setAppointment] = useState<BusinessAppointmentDetail | null>(null);
  const [styleName, setStyleName] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
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
      const result = await getBusinessAppointment(
        activeMembership.barbershop.id,
        appointmentId,
        token,
      );
      setAppointment(result);
      setStyleName(result.haircutRecord?.styleName ?? '');
      setNotes(result.haircutRecord?.notes ?? '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tıraş kaydı yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, appointmentId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  async function submit() {
    if (!appointment || !appointmentId || !token) return;

    setSubmitting(true);
    setError(null);
    try {
      if (appointment.status !== 'COMPLETED') {
        await completeBusinessAppointment(
          appointment.barbershop.id,
          appointmentId,
          token,
        );
      }

      await saveBusinessHaircutRecord(
        appointment.barbershop.id,
        appointmentId,
        {
          styleName: styleName.trim() || undefined,
          notes: notes.trim() || undefined,
        },
        token,
      );
      router.back();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tıraş kaydı kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader onBack={() => router.back()} title="Tıraş Kaydı" />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && appointment ? (
        <BusinessHaircutRecordForm
          appointment={appointment}
          error={error}
          isSubmitting={isSubmitting}
          notes={notes}
          onChangeNotes={setNotes}
          onChangeStyleName={setStyleName}
          onSubmit={() => void submit()}
          styleName={styleName}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
});
