import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { UnsavedChangesSheet } from '@/components/ui/UnsavedChangesSheet';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  defaultClosingTime,
  defaultOpeningTime,
  timeToMinutes,
  weekdayOptions,
} from '@/features/business-hours/constants';
import { TimePickerModal } from '@/features/business-hours/components/TimePickerModal';
import { EmployeeSchedulesCard } from '@/features/business-hours/components/EmployeeSchedulesCard';
import { WorkingHoursDayCard } from '@/features/business-hours/components/WorkingHoursDayCard';
import { WorkingHoursSummaryCard } from '@/features/business-hours/components/WorkingHoursSummaryCard';
import type { WorkingDayDraft } from '@/features/business-hours/types';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import {
  getBusinessWorkingHours,
  updateBusinessWorkingHours,
} from '@/features/schedules/api';
import type { BusinessWorkingHours, Weekday } from '@/features/schedules/types';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type PickerTarget = {
  field: 'startTime' | 'endTime';
  weekday: Weekday;
};

function createDrafts(hours: BusinessWorkingHours[]): WorkingDayDraft[] {
  return weekdayOptions.map(({ value }) => {
    const savedHours = hours.find((item) => item.weekday === value);

    return {
      weekday: value,
      isOpen: Boolean(savedHours),
      startTime: savedHours?.startTime ?? defaultOpeningTime,
      endTime: savedHours?.endTime ?? defaultClosingTime,
    };
  });
}

function serializeDays(days: WorkingDayDraft[]) {
  return JSON.stringify(days);
}

export default function BusinessWorkingHoursScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [days, setDays] = useState<WorkingDayDraft[]>([]);
  const [savedDays, setSavedDays] = useState<WorkingDayDraft[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unsavedSheetVisible, setUnsavedSheetVisible] = useState(false);

  const loadWorkingHours = useCallback(async () => {
    if (!activeMembership) return;

    setLoading(true);
    setLoadError(null);
    try {
      const nextDays = createDrafts(
        await getBusinessWorkingHours(activeMembership.barbershop.id, true),
      );
      setDays(nextDays);
      setSavedDays(nextDays);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Çalışma saatleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership]);

  useFocusEffect(
    useCallback(() => {
      void loadWorkingHours();
    }, [loadWorkingHours]),
  );

  const hasChanges = serializeDays(days) !== serializeDays(savedDays);
  const summary = useMemo(() => {
    const openDays = days.filter((day) => day.isOpen);
    const totalMinutes = openDays.reduce(
      (total, day) => total + Math.max(0, timeToMinutes(day.endTime) - timeToMinutes(day.startTime)),
      0,
    );

    return { openDayCount: openDays.length, totalMinutes };
  }, [days]);

  const selectedDay = pickerTarget
    ? days.find((day) => day.weekday === pickerTarget.weekday)
    : undefined;
  const pickerValue = pickerTarget && selectedDay ? selectedDay[pickerTarget.field] : defaultOpeningTime;

  if (!activeMembership) return null;

  function updateDay(weekday: Weekday, updates: Partial<WorkingDayDraft>) {
    setDays((current) =>
      current.map((day) => (day.weekday === weekday ? { ...day, ...updates } : day)),
    );
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
    if (!activeMembership || !token) return false;

    for (const day of days.filter((item) => item.isOpen)) {
      if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) {
        const label = weekdayOptions.find((item) => item.value === day.weekday)?.label ?? 'Seçilen gün';
        setSubmitError(`${label} için kapanış saati açılış saatinden sonra olmalı.`);
        return false;
      }
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const savedHours = await updateBusinessWorkingHours(
        activeMembership.barbershop.id,
        {
          hours: days
            .filter((day) => day.isOpen)
            .map(({ endTime, startTime, weekday }) => ({ endTime, startTime, weekday })),
        },
        token,
      );
      const nextDays = createDrafts(savedHours);
      setDays(nextDays);
      setSavedDays(nextDays);
      setSuccessMessage(
        'Yeni çalışma saatleri en erken yarın, çakışan randevu varsa son çakışmanın ertesi günü uygulanacak. Mevcut randevular korunuyor.',
      );
      return true;
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Çalışma saatleri kaydedilemedi.');
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
        <BusinessDetailHeader onBack={handleBack} title="Çalışma Saatleri" />
        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && loadError ? (
          <BusinessManagementState
            description={loadError}
            onRetry={() => void loadWorkingHours()}
            title="Çalışma saatleri yüklenemedi"
          />
        ) : null}

        {!isLoading && !loadError ? (
          <>
            <WorkingHoursSummaryCard
              openDayCount={summary.openDayCount}
              totalMinutes={summary.totalMinutes}
            />
            <EmployeeSchedulesCard
              onPress={() => router.push('/management/hours/members')}
              onTimeOffPress={() => router.push('/management/hours/blocks')}
            />

            <View style={styles.sectionHeading}>
              <View style={styles.sectionCopy}>
                <AppText style={styles.sectionTitle} variant="sectionTitle">İşletme saatleri</AppText>
              </View>
              <View style={[styles.openBadge, { backgroundColor: themeColors.surfaceMuted }]}>
                <AppText color="primary" variant="label">{summary.openDayCount}/7 açık</AppText>
              </View>
            </View>

            {days.map((day) => {
              const dayOption = weekdayOptions.find((item) => item.value === day.weekday);
              return (
                <WorkingHoursDayCard
                  day={day}
                  key={day.weekday}
                  label={dayOption?.label ?? day.weekday}
                  onChangeTime={(field) => setPickerTarget({ field, weekday: day.weekday })}
                  onToggle={(isOpen) => updateDay(day.weekday, { isOpen })}
                />
              );
            })}

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
              {isSubmitting ? 'Kaydediliyor...' : hasChanges ? 'Çalışma Saatlerini Kaydet' : 'Değişiklik Yok'}
            </AppButton>
          </>
        ) : null}
      </ScrollView>

      {pickerTarget ? (
        <TimePickerModal
          label={pickerTarget.field === 'endTime' ? 'Kapanış saati' : 'Açılış saati'}
          onClose={() => setPickerTarget(null)}
          onSelect={(value) => {
            updateDay(pickerTarget.weekday, { [pickerTarget.field]: value });
            setPickerTarget(null);
          }}
          value={pickerValue}
        />
      ) : null}
      <UnsavedChangesSheet
        description="Çalışma saatlerinde yaptığın değişiklikleri kaydedebilir veya silebilirsin."
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
  sectionHeading: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm, marginTop: layout.sectionGap },
  sectionCopy: { flex: 1, paddingRight: spacing.sm },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  openBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  message: { borderRadius: radius.md, marginBottom: spacing.sm, padding: spacing.sm },
  errorMessage: { backgroundColor: '#F8E7E3' },
  successMessage: { backgroundColor: '#E8F1E5' },
  successText: { color: '#4F7653' },
});
