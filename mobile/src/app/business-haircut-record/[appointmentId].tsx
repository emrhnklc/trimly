import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import {
  completeBusinessAppointment,
  getBusinessAppointment,
} from '@/features/appointments/api';
import type { BusinessAppointmentDetail } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import {
  finalizeBusinessHaircutRecord,
  saveBusinessHaircutRecord,
} from '@/features/haircut-history/api';
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
  const [isSaved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());

  const photoUploadDeadline = appointment?.completedAt
    ? new Date(appointment.completedAt).getTime() + 60 * 1000
    : 0;
  const canAddPhoto = photoUploadDeadline > referenceTime;

  useEffect(() => {
    if (!photoUploadDeadline) return;
    const remainingMs = photoUploadDeadline - Date.now();
    if (remainingMs <= 0) return;
    const timeout = setTimeout(() => setReferenceTime(Date.now()), remainingMs + 50);
    return () => clearTimeout(timeout);
  }, [photoUploadDeadline]);

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
      setReferenceTime(Date.now());
      setStyleName(result.haircutRecord?.styleName ?? '');
      setNotes(result.haircutRecord?.notes ?? '');
      setSaved(Boolean(result.haircutRecord && !result.haircutRecord.finalizedAt));
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
        const completedAppointment = await completeBusinessAppointment(
          appointment.barbershop.id,
          appointmentId,
          token,
        );
        setAppointment((current) =>
          current
            ? {
                ...current,
                completedAt:
                  completedAppointment.completedAt ?? new Date().toISOString(),
                status: 'COMPLETED',
              }
            : current,
        );
        setReferenceTime(Date.now());
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
      setSaved(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tıraş kaydı kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function finish() {
    if (!appointment || !appointmentId || !token) return;

    setSubmitting(true);
    setError(null);
    try {
      await finalizeBusinessHaircutRecord(
        appointment.barbershop.id,
        appointmentId,
        token,
      );
      router.dismissTo({
        pathname: '/business-appointments/[appointmentId]',
        params: { appointmentId },
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tıraş kaydı tamamlanamadı.');
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

      {!isLoading && appointment?.haircutRecord?.finalizedAt ? (
        <View style={styles.lockedState}>
          <AppText style={styles.lockedTitle} variant="heading">Tıraş kaydı tamamlandı</AppText>
          <AppText color="textMuted" style={styles.lockedDescription}>
            Tamamlanan kayıt işletme tarafından değiştirilemez. Müşteri kendi geçmişinden fotoğraf ekleyebilir.
          </AppText>
          <AppButton onPress={() => router.back()} variant="secondary">Randevuya Dön</AppButton>
        </View>
      ) : null}

      {!isLoading && appointment && !appointment.haircutRecord?.finalizedAt ? (
        <BusinessHaircutRecordForm
          appointment={appointment}
          canAddPhoto={canAddPhoto}
          error={error}
          isSubmitting={isSubmitting}
          notes={notes}
          onChangeNotes={setNotes}
          onChangeStyleName={setStyleName}
          isSaved={isSaved}
          onAddPhoto={() =>
            router.push({
              pathname: '/business-haircut-camera/[appointmentId]',
              params: {
                appointmentId: appointment.id,
                photoCount: String(appointment.haircutRecord?.photos.length ?? 0),
              },
            })
          }
          onSubmit={() => void submit()}
          styleName={styleName}
        />
      ) : null}

      {isSaved ? (
        <View style={styles.doneButton}>
          <AppButton disabled={isSubmitting} onPress={() => void finish()} variant="secondary">
            {isSubmitting ? 'Tamamlanıyor…' : 'Kaydı Tamamla'}
          </AppButton>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
  doneButton: {
    marginBottom: spacing.xl,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  lockedState: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl },
  lockedTitle: { textAlign: 'center' },
  lockedDescription: { lineHeight: 21, marginBottom: spacing.xl, marginTop: spacing.xs, textAlign: 'center' },
});
