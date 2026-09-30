import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { UnsavedChangesSheet } from '@/components/ui/UnsavedChangesSheet';
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
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

function serializeSettings(settings: BookingSettings | null) {
  return settings ? JSON.stringify(settings) : '';
}

function presentPendingSlot(settings: BookingSettings) {
  return settings.pendingSlotIntervalMinutes
    ? { ...settings, slotIntervalMinutes: settings.pendingSlotIntervalMinutes }
    : settings;
}

export default function BookingSettingsScreen() {
  const themeColors = useThemeColors();
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
  const [unsavedSheetVisible, setUnsavedSheetVisible] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!activeMembership) return;

    setLoading(true);
    setLoadError(null);
    try {
      const nextSettings = presentPendingSlot(
        await getBookingSettings(activeMembership.barbershop.id),
      );
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
      goBackOrReplace(router, '/(business)/management');
      return;
    }

    setUnsavedSheetVisible(true);
  }

  async function handleSave() {
    if (!activeMembership || !settings || !token) return false;

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
      const displayedSettings = presentPendingSlot(saved);
      setSettings(displayedSettings);
      setSavedSettings(displayedSettings);
      setSuccessMessage(
        saved.pendingSlotIntervalMinutes && saved.slotIntervalEffectiveFrom
          ? `Slot aralığı ${formatEffectiveDate(saved.slotIntervalEffectiveFrom)} tarihinden itibaren uygulanacak. Mevcut randevular korunuyor.`
          : 'Randevu ayarları kaydedildi.',
      );
      return true;
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Randevu ayarları kaydedilemedi.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  async function saveAndLeave() {
    if (await handleSave()) {
      setUnsavedSheetVisible(false);
      goBackOrReplace(router, '/(business)/management');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader onBack={handleBack} title="Randevu Ayarları" />
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
              <AppText style={styles.sectionTitle} variant="sectionTitle">Randevu penceresi</AppText>
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
              <AppText style={styles.sectionTitle} variant="sectionTitle">Saat düzeni</AppText>
            </View>
            <BookingSlotIntervalCard
              onChange={(value) => changeSettings({ slotIntervalMinutes: value })}
              value={settings.slotIntervalMinutes}
            />

            <View style={[styles.infoCard, { backgroundColor: themeColors.surfaceMuted }]}>
              <AppText variant="label">Slot aralığı ve hizmet süresi farklıdır</AppText>
              <AppText color="textMuted" style={styles.infoDescription} variant="bodySmall">
                Örneğin 15 dakikalık slot düzeninde 45 dakikalık Saç + Sakal hizmeti üç aralığı kaplar.
              </AppText>
            </View>

            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle} variant="sectionTitle">İptal politikası</AppText>
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
      <UnsavedChangesSheet
        description="Randevu ayarlarında yaptığın değişiklikleri kaydedebilir veya silebilirsin."
        isSaving={isSubmitting}
        onContinue={() => setUnsavedSheetVisible(false)}
        onDiscard={() => {
          setUnsavedSheetVisible(false);
          goBackOrReplace(router, '/(business)/management');
        }}
        onSave={() => void saveAndLeave()}
        visible={unsavedSheetVisible}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
  sectionHeading: { marginBottom: spacing.sm, marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  infoCard: {
    borderRadius: radius.card,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  infoDescription: { marginTop: 2 },
  message: { borderRadius: radius.md, marginBottom: spacing.sm, marginTop: spacing.sm, padding: spacing.sm },
  errorMessage: { backgroundColor: '#F8E7E3' },
  successMessage: { backgroundColor: '#E8F1E5' },
  successText: { color: '#4F7653' },
});

function formatEffectiveDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}
