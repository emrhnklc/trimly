import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

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
import { EmployeeScheduleIdentityCard } from '@/features/business-hours/components/EmployeeScheduleIdentityCard';
import { ScheduleBlocksNavigationCard } from '@/features/business-hours/components/ScheduleBlocksNavigationCard';
import { TimePickerModal } from '@/features/business-hours/components/TimePickerModal';
import { WorkingHoursDayCard } from '@/features/business-hours/components/WorkingHoursDayCard';
import { WorkingHoursSummaryCard } from '@/features/business-hours/components/WorkingHoursSummaryCard';
import type { WorkingDayDraft } from '@/features/business-hours/types';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { getBusinessMember } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import {
  getBusinessWorkingHours,
  getMemberWorkingHours,
  updateMemberWorkingHours,
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

function createMemberDrafts(
  businessHours: BusinessWorkingHours[],
  memberHours: BusinessWorkingHours[],
): WorkingDayDraft[] {
  return weekdayOptions.map(({ value }) => {
    const businessDay = businessHours.find((item) => item.weekday === value);
    const memberDay = memberHours.find((item) => item.weekday === value);

    return {
      weekday: value,
      isOpen: Boolean(businessDay && memberDay),
      startTime: memberDay?.startTime ?? businessDay?.startTime ?? defaultOpeningTime,
      endTime: memberDay?.endTime ?? businessDay?.endTime ?? defaultClosingTime,
    };
  });
}

function serializeDays(days: WorkingDayDraft[]) {
  return JSON.stringify(days);
}

export default function EmployeeScheduleDetailScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [member, setMember] = useState<BusinessMember | null>(null);
  const [businessHours, setBusinessHours] = useState<BusinessWorkingHours[]>([]);
  const [days, setDays] = useState<WorkingDayDraft[]>([]);
  const [savedDays, setSavedDays] = useState<WorkingDayDraft[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unsavedSheetVisible, setUnsavedSheetVisible] = useState(false);

  const loadSchedule = useCallback(async () => {
    if (!activeMembership || !memberId || !token) return;

    setLoading(true);
    setLoadError(null);
    try {
      const barbershopId = activeMembership.barbershop.id;
      const [nextMember, nextBusinessHours, nextMemberHours] = await Promise.all([
        getBusinessMember(barbershopId, memberId, token),
        getBusinessWorkingHours(barbershopId, true),
        getMemberWorkingHours(barbershopId, memberId, token, true),
      ]);
      const nextDays = createMemberDrafts(nextBusinessHours, nextMemberHours);
      setMember(nextMember);
      setBusinessHours(nextBusinessHours);
      setDays(nextDays);
      setSavedDays(nextDays);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Çalışan vardiyası yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, memberId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadSchedule();
    }, [loadSchedule]),
  );

  const hasChanges = serializeDays(days) !== serializeDays(savedDays);
  const businessHoursByDay = useMemo(
    () => new Map(businessHours.map((hours) => [hours.weekday, hours])),
    [businessHours],
  );
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
      goBackOrReplace(router, '/(business)/management/hours/members');
      return;
    }

    setUnsavedSheetVisible(true);
  }

  function copyBusinessHours() {
    setDays(createMemberDrafts(businessHours, businessHours));
    setSubmitError(null);
    setSuccessMessage(null);
  }

  async function persistSchedule() {
    if (!activeMembership || !memberId || !token) return false;

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const savedHours = await updateMemberWorkingHours(
        activeMembership.barbershop.id,
        memberId,
        {
          hours: days
            .filter((day) => day.isOpen)
            .map(({ endTime, startTime, weekday }) => ({ endTime, startTime, weekday })),
        },
        token,
      );
      const nextDays = createMemberDrafts(businessHours, savedHours);
      setDays(nextDays);
      setSavedDays(nextDays);
      setSuccessMessage(
        'Yeni vardiya en erken yarın, çakışan randevu varsa son çakışmanın ertesi günü uygulanacak. Mevcut randevular korunuyor.',
      );
      return true;
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Çalışan vardiyası kaydedilemedi.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  function validateSchedule() {
    for (const day of days.filter((item) => item.isOpen)) {
      const businessDay = businessHoursByDay.get(day.weekday);
      const label = weekdayOptions.find((item) => item.value === day.weekday)?.label ?? 'Seçilen gün';

      if (!businessDay) {
        setSubmitError(`${label} günü işletme kapalı olduğu için vardiya eklenemez.`);
        return false;
      }
      if (timeToMinutes(day.startTime) >= timeToMinutes(day.endTime)) {
        setSubmitError(`${label} için vardiya bitişi başlangıç saatinden sonra olmalı.`);
        return false;
      }
      if (
        timeToMinutes(day.startTime) < timeToMinutes(businessDay.startTime) ||
        timeToMinutes(day.endTime) > timeToMinutes(businessDay.endTime)
      ) {
        setSubmitError(
          `${label} vardiyası işletmenin ${businessDay.startTime}–${businessDay.endTime} saatleri içinde olmalı.`,
        );
        return false;
      }
    }

    return true;
  }

  function handleSave() {
    if (!validateSchedule()) return;

    if (!days.some((day) => day.isOpen) && member?.isBookable) {
      Alert.alert(
        'Tüm vardiyalar kapatılsın mı?',
        'Bu çalışana ait uygun randevu saati oluşmayacak.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Vardiyaları Kapat', style: 'destructive', onPress: () => void persistSchedule() },
        ],
      );
      return;
    }

    void persistSchedule();
  }

  async function saveAndLeave() {
    if (!validateSchedule()) return;
    if (await persistSchedule()) {
      setUnsavedSheetVisible(false);
      goBackOrReplace(router, '/(business)/management/hours/members');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader onBack={handleBack} title="Vardiyayı Düzenle" />
        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && loadError ? (
          <BusinessManagementState
            description={loadError}
            onRetry={() => void loadSchedule()}
            title="Vardiya yüklenemedi"
          />
        ) : null}

        {!isLoading && !loadError && member ? (
          <>
            <EmployeeScheduleIdentityCard member={member} />
            <WorkingHoursSummaryCard
              openDayCount={summary.openDayCount}
              totalMinutes={summary.totalMinutes}
            />
            <ScheduleBlocksNavigationCard
              onPress={() =>
                router.push({
                  pathname: '/management/hours/blocks/[memberId]',
                  params: { memberId },
                })
              }
            />

            {!member.isActive || !member.isBookable ? (
              <View style={[styles.warningCard, { backgroundColor: themeColors.surfaceMuted }]}>
                <AppText variant="label">
                  {!member.isActive ? 'Çalışan şu an pasif' : 'Çalışan randevuya kapalı'}
                </AppText>
                <AppText color="textMuted" style={styles.warningDescription} variant="bodySmall">
                  Vardiyayı kaydedebilirsin ancak çalışan aktif ve randevuya açık olana kadar saat üretilmez.
                </AppText>
              </View>
            ) : null}

            <View style={styles.sectionHeading}>
              <View style={styles.sectionCopy}>
                <AppText style={styles.sectionTitle} variant="heading">Haftalık vardiya</AppText>
                <AppText color="textMuted" variant="bodySmall">
                  İşletmenin açık saatleri dışındaki zamanlar kullanılamaz.
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={copyBusinessHours}
                style={({ pressed }) => [
                  styles.copyButton,
                  { backgroundColor: themeColors.surfaceMuted },
                  pressed && styles.pressed,
                ]}>
                <AppText color="primary" style={styles.copyButtonLabel} variant="label">
                  İşletmeden Kopyala
                </AppText>
              </Pressable>
            </View>

            {days.map((day) => {
              const dayOption = weekdayOptions.find((item) => item.value === day.weekday);
              const businessDay = businessHoursByDay.get(day.weekday);
              return (
                <WorkingHoursDayCard
                  closedLabel={businessDay ? 'Bu gün çalışmıyor' : 'İşletme kapalı'}
                  day={day}
                  disabled={!businessDay}
                  key={day.weekday}
                  label={dayOption?.label ?? day.weekday}
                  onChangeTime={(field) => setPickerTarget({ field, weekday: day.weekday })}
                  onToggle={(isOpen) => updateDay(day.weekday, { isOpen })}
                />
              );
            })}

            {submitError ? (
              <View style={[styles.message, { backgroundColor: themeColors.dangerSurface }]}>
                <AppText color="danger" variant="bodySmall">{submitError}</AppText>
              </View>
            ) : null}

            {successMessage ? (
              <View style={[styles.message, { backgroundColor: themeColors.successSurface }]}>
                <AppText color="success" variant="bodySmall">{successMessage}</AppText>
              </View>
            ) : null}

            <AppButton disabled={isSubmitting || !hasChanges} onPress={handleSave}>
              {isSubmitting ? 'Kaydediliyor...' : hasChanges ? 'Vardiyayı Kaydet' : 'Değişiklik Yok'}
            </AppButton>
          </>
        ) : null}
      </ScrollView>

      {pickerTarget ? (
        <TimePickerModal
          label={pickerTarget.field === 'endTime' ? 'Vardiya bitişi' : 'Vardiya başlangıcı'}
          onClose={() => setPickerTarget(null)}
          onSelect={(value) => {
            updateDay(pickerTarget.weekday, { [pickerTarget.field]: value });
            setPickerTarget(null);
          }}
          value={pickerValue}
        />
      ) : null}
      <UnsavedChangesSheet
        description="Çalışan vardiyasında yaptığın değişiklikleri kaydedebilir veya silebilirsin."
        isSaving={isSubmitting}
        onContinue={() => setUnsavedSheetVisible(false)}
        onDiscard={() => {
          setUnsavedSheetVisible(false);
          goBackOrReplace(router, '/(business)/management/hours/members');
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
  warningCard: {
    borderRadius: radius.card,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  warningDescription: { marginTop: 2 },
  sectionHeading: { marginBottom: spacing.sm, marginTop: spacing.xl },
  sectionCopy: { paddingRight: spacing.sm },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: 2 },
  copyButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  copyButtonLabel: { fontSize: 12, lineHeight: 16 },
  message: { borderRadius: radius.card, marginBottom: spacing.sm, padding: spacing.sm },
  pressed: { opacity: 0.68 },
});
