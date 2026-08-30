import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getBookingSettings,
  updateBookingSettings,
} from '@/features/barbershops/api';
import type { BookingSettings } from '@/features/barbershops/types';
import { BookingNumberSettingCard } from '@/features/booking-settings/components/BookingNumberSettingCard';
import { BookingSettingsSummaryCard } from '@/features/booking-settings/components/BookingSettingsSummaryCard';
import { BookingSlotIntervalCard } from '@/features/booking-settings/components/BookingSlotIntervalCard';
import { CustomerCancellationCard } from '@/features/booking-settings/components/CustomerCancellationCard';
import { formatMinutes } from '@/features/booking-settings/format';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function serializeSettings(settings: BookingSettings | null) {
  return settings ? JSON.stringify(settings) : '';
}

export default function BookingSettingsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<BookingSettings | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!activeMembership) return;

    setLoading(true);
    setLoadError(null);
    try {
      const nextSettings = await getBookingSettings(activeMembership.barbershop.id);
      setSettings(nextSettings);
      setSavedSettings(nextSettings);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Randevu ayarları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership]);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  const hasChanges = serializeSettings(settings) !== serializeSettings(savedSettings);

  if (!activeMembership) return null;

  function changeSettings(updates: Partial<BookingSettings>) {
    setSettings((current) => (current ? { ...current, ...updates } : current));
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleBack() {
    if (!hasChanges) {
      router.dismissTo('/management');
      return;
    }

    Alert.alert(
      'Kaydedilmemiş değişiklikler',
      'Randevu ayarlarında yaptığın değişiklikler kaybolacak.',
      [
        { text: 'Düzenlemeye Devam Et', style: 'cancel' },
        {
          text: 'Değişiklikleri Sil',
          style: 'destructive',
          onPress: () => router.dismissTo('/management'),
        },
      ],
    );
  }

  async function handleSave() {
    if (!activeMembership || !settings || !token) return;

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const saved = await updateBookingSettings(
        activeMembership.barbershop.id,
        {
          cancellationNoticeMinutes: settings.cancellationNoticeMinutes,
          customerCancellationEnabled: settings.customerCancellationEnabled,
          maxBookingAdvanceDays: settings.maxBookingAdvanceDays,
          minBookingNoticeMinutes: settings.minBookingNoticeMinutes,
          slotIntervalMinutes: settings.slotIntervalMinutes,
        },
        token,
      );
      setSettings(saved);
      setSavedSettings(saved);
      setSuccessMessage('Randevu ayarları kaydedildi. Yeni uygun saatler bu kurallara göre üretilecek.');
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Randevu ayarları kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader onBack={handleBack} title="Randevu Ayarları" />
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          Müşterilerin ne zaman randevu alıp iptal edebileceğini belirle.
        </AppText>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && loadError ? (
          <BusinessManagementState
            description={loadError}
            onRetry={() => void loadSettings()}
            title="Randevu ayarları yüklenemedi"
          />
        ) : null}

        {!isLoading && !loadError && settings ? (
          <>
            <BookingSettingsSummaryCard settings={settings} />

            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle} variant="heading">Randevu penceresi</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Müşterinin seçebileceği tarih aralığını yönet.
              </AppText>
            </View>
            <BookingNumberSettingCard
              description="Örneğin 60 dakika seçilirse daha yakın saatlere randevu alınamaz."
              formatValue={formatMinutes}
              label="Minimum ön bildirim"
              max={1440}
              min={0}
              onChange={(value) => changeSettings({ minBookingNoticeMinutes: value })}
              step={30}
              value={settings.minBookingNoticeMinutes}
            />
            <BookingNumberSettingCard
              description="Bugün dahil müşteriye gösterilecek en ileri günü belirler."
              formatValue={(value) => (value === 0 ? 'Sadece bugün' : `${value} gün`)}
              label="İleri tarih sınırı"
              max={365}
              min={0}
              onChange={(value) => changeSettings({ maxBookingAdvanceDays: value })}
              step={1}
              value={settings.maxBookingAdvanceDays}
            />

            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle} variant="heading">Saat düzeni</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Bu değer hizmet süresini değiştirmez; yalnızca başlangıç seçeneklerini belirler.
              </AppText>
            </View>
            <BookingSlotIntervalCard
              onChange={(value) => changeSettings({ slotIntervalMinutes: value })}
              value={settings.slotIntervalMinutes}
            />

            <View style={styles.infoCard}>
              <AppText variant="label">Slot aralığı ve hizmet süresi farklıdır</AppText>
              <AppText color="textMuted" style={styles.infoDescription} variant="bodySmall">
                Örneğin 15 dakikalık slot düzeninde 45 dakikalık Saç + Sakal hizmeti üç aralığı kaplar.
              </AppText>
            </View>

            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle} variant="heading">İptal politikası</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Randevu yaklaşınca müşterinin iptal yetkisini sınırla.
              </AppText>
            </View>
            <CustomerCancellationCard
              enabled={settings.customerCancellationEnabled}
              noticeMinutes={settings.cancellationNoticeMinutes}
              onChangeEnabled={(value) => changeSettings({ customerCancellationEnabled: value })}
              onChangeNotice={(value) => changeSettings({ cancellationNoticeMinutes: value })}
            />

            {submitError ? (
              <View style={[styles.message, styles.errorMessage]}>
                <AppText color="danger" variant="bodySmall">{submitError}</AppText>
              </View>
            ) : null}

            {successMessage ? (
              <View style={[styles.message, styles.successMessage]}>
                <AppText style={styles.successText} variant="bodySmall">{successMessage}</AppText>
              </View>
            ) : null}

            <AppButton disabled={isSubmitting || !hasChanges} onPress={() => void handleSave()}>
              {isSubmitting ? 'Kaydediliyor...' : hasChanges ? 'Ayarları Kaydet' : 'Değişiklik Yok'}
            </AppButton>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  sectionHeading: { marginBottom: spacing.sm, marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, lineHeight: 24, marginBottom: 2 },
  infoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  infoDescription: { marginTop: 2 },
  message: { borderRadius: radius.md, marginBottom: spacing.sm, marginTop: spacing.sm, padding: spacing.sm },
  errorMessage: { backgroundColor: '#F8E7E3' },
  successMessage: { backgroundColor: '#E8F1E5' },
  successText: { color: '#4F7653' },
});
