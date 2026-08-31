import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
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
import { saveBusinessHaircutRecord } from '@/features/haircut-history/api';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

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
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <SymbolView
                name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
                size={23}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.summaryCopy}>
              <AppText variant="heading">
                {appointment.customer.firstName} {appointment.customer.lastName}
              </AppText>
              <AppText color="textMuted" style={styles.summaryService} variant="bodySmall">
                {appointment.serviceNameSnapshot} · {appointment.durationMinutes} dk
              </AppText>
            </View>
          </AppCard>

          <AppText style={styles.introTitle} variant="heading">
            Bu tıraşı hatırlanabilir yap
          </AppText>
          <AppText color="textMuted" style={styles.introText} variant="bodySmall">
            Model ve uygulama notları, müşterinin sonraki ziyaretinde aynı sonucu yakalamana yardım eder.
          </AppText>

          <AppText style={styles.fieldLabel} variant="label">Model / stil adı</AppText>
          <TextInput
            accessibilityLabel="Model veya stil adı"
            autoCapitalize="words"
            maxLength={100}
            onChangeText={setStyleName}
            placeholder="Örn. Low fade, klasik kesim"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={styleName}
          />

          <AppText style={styles.fieldLabel} variant="label">Berber notu</AppText>
          <TextInput
            accessibilityLabel="Tıraş notu"
            maxLength={2000}
            multiline
            onChangeText={setNotes}
            placeholder="Geçiş numarası, üst uzunluğu, müşterinin tercihi…"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.notesInput]}
            textAlignVertical="top"
            value={notes}
          />
          <AppText color="textMuted" style={styles.counter} variant="bodySmall">
            {notes.length}/2000
          </AppText>

          {error ? (
            <View style={styles.errorBox}>
              <AppText color="danger" variant="bodySmall">{error}</AppText>
            </View>
          ) : null}

          <View style={styles.submitButton}>
            <AppButton disabled={isSubmitting} onPress={() => void submit()}>
              {isSubmitting
                ? 'Kaydediliyor…'
                : appointment.status === 'COMPLETED'
                  ? 'Tıraş Kaydını Güncelle'
                  : 'Tıraşı Tamamla ve Kaydet'}
            </AppButton>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  summaryCard: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  summaryCopy: { flex: 1, marginLeft: spacing.sm },
  summaryService: { marginTop: 2 },
  introTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 27,
    marginTop: spacing.xl,
  },
  introText: { lineHeight: 20, marginTop: spacing.xs },
  fieldLabel: { marginBottom: spacing.xs, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fontFamily.body,
    fontSize: 14,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesInput: { minHeight: 126 },
  counter: { marginTop: 4, textAlign: 'right' },
  errorBox: {
    backgroundColor: '#F8E8E5',
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  submitButton: { marginTop: spacing.xl },
});
