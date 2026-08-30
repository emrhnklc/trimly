import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { DatePickerModal } from '@/features/business-hours/components/DatePickerModal';
import { EmployeeScheduleIdentityCard } from '@/features/business-hours/components/EmployeeScheduleIdentityCard';
import { ScheduleBlockTypeSelector } from '@/features/business-hours/components/ScheduleBlockTypeSelector';
import { TimePickerModal } from '@/features/business-hours/components/TimePickerModal';
import {
  createDefaultBlockWindow,
  formatDateKey,
  zonedDateTimeToIso,
} from '@/features/business-hours/date';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { getDateKey } from '@/features/business-appointments/date';
import { getBusinessMember } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { createMemberScheduleBlock } from '@/features/schedules/api';
import type { ScheduleBlockType } from '@/features/schedules/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime';

function DateTimeField({
  icon,
  label,
  onPress,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.field, pressed && styles.pressed]}>
      <View style={styles.fieldIcon}>
        <SymbolView name={icon} size={19} tintColor={colors.primary} />
      </View>
      <View style={styles.fieldCopy}>
        <AppText color="textMuted" variant="bodySmall">{label}</AppText>
        <AppText style={styles.fieldValue} variant="label">{value}</AppText>
      </View>
      <SymbolView
        name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
        size={17}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

export default function NewEmployeeScheduleBlockScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const timeZone = activeMembership?.barbershop.timezone ?? 'Europe/Istanbul';
  const initialWindow = useMemo(() => createDefaultBlockWindow(timeZone), [timeZone]);
  const [member, setMember] = useState<BusinessMember | null>(null);
  const [type, setType] = useState<ScheduleBlockType>('BREAK');
  const [startDate, setStartDate] = useState(initialWindow.startDate);
  const [startTime, setStartTime] = useState(initialWindow.startTime);
  const [endDate, setEndDate] = useState(initialWindow.endDate);
  const [endTime, setEndTime] = useState(initialWindow.endTime);
  const [note, setNote] = useState('');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const minDate = getDateKey(new Date(), timeZone);

  useEffect(() => {
    if (!activeMembership || !memberId || !token) return;

    let isMounted = true;
    getBusinessMember(activeMembership.barbershop.id, memberId, token)
      .then((nextMember) => {
        if (isMounted) setMember(nextMember);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [activeMembership, memberId, token]);

  if (!activeMembership) return null;

  function goBack() {
    router.dismissTo({
      pathname: '/management/hours/blocks/[memberId]',
      params: { memberId },
    });
  }

  function selectType(nextType: ScheduleBlockType) {
    setType(nextType);
    if (nextType === 'BREAK') setEndDate(startDate);
    setError(null);
  }

  function selectDate(value: string) {
    if (pickerTarget === 'startDate') {
      setStartDate(value);
      if (type === 'BREAK' || endDate < value) setEndDate(value);
    } else if (pickerTarget === 'endDate') {
      setEndDate(value);
    }
    setPickerTarget(null);
    setError(null);
  }

  function selectTime(value: string) {
    if (pickerTarget === 'startTime') setStartTime(value);
    if (pickerTarget === 'endTime') setEndTime(value);
    setPickerTarget(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!activeMembership || !memberId || !token) return;

    const effectiveEndDate = type === 'BREAK' ? startDate : endDate;
    const startsAt = zonedDateTimeToIso(startDate, startTime, timeZone);
    const endsAt = zonedDateTimeToIso(effectiveEndDate, endTime, timeZone);

    if (new Date(startsAt) >= new Date(endsAt)) {
      setError('Bitiş zamanı başlangıç zamanından sonra olmalı.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createMemberScheduleBlock(
        activeMembership.barbershop.id,
        memberId,
        {
          endsAt,
          note: note.trim() || undefined,
          startsAt,
          type,
        },
        token,
      );
      goBack();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mola veya izin eklenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  const datePickerOpen = pickerTarget === 'startDate' || pickerTarget === 'endDate';
  const timePickerOpen = pickerTarget === 'startTime' || pickerTarget === 'endTime';
  const datePickerValue = pickerTarget === 'endDate' ? endDate : startDate;
  const timePickerValue = pickerTarget === 'endTime' ? endTime : startTime;

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BusinessDetailHeader onBack={goBack} title="Yeni Mola veya İzin" />
          <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
            Çalışanın randevuya kapalı olacağı tek seferlik zaman aralığını belirle.
          </AppText>

          {member ? <EmployeeScheduleIdentityCard member={member} /> : null}

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="heading">Kayıt türü</AppText>
            <AppText color="textMuted" style={styles.sectionDescription} variant="bodySmall">
              Mola aynı gün içinde, izin ise birden fazla gün için oluşturulabilir.
            </AppText>
            <ScheduleBlockTypeSelector onChange={selectType} value={type} />
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="heading">Başlangıç</AppText>
            <View style={styles.fieldRow}>
              <DateTimeField
                icon={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                label="Tarih"
                onPress={() => setPickerTarget('startDate')}
                value={formatDateKey(startDate, { short: true })}
              />
              <DateTimeField
                icon={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                label="Saat"
                onPress={() => setPickerTarget('startTime')}
                value={startTime}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="heading">Bitiş</AppText>
            <View style={styles.fieldRow}>
              {type === 'TIME_OFF' ? (
                <DateTimeField
                  icon={{ ios: 'calendar', android: 'calendar_today', web: 'calendar_today' }}
                  label="Tarih"
                  onPress={() => setPickerTarget('endDate')}
                  value={formatDateKey(endDate, { short: true })}
                />
              ) : (
                <View style={styles.sameDayField}>
                  <AppText color="textMuted" variant="bodySmall">Aynı gün</AppText>
                  <AppText style={styles.fieldValue} variant="label">
                    {formatDateKey(startDate, { short: true })}
                  </AppText>
                </View>
              )}
              <DateTimeField
                icon={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                label="Saat"
                onPress={() => setPickerTarget('endTime')}
                value={endTime}
              />
            </View>
          </View>

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="heading">Not</AppText>
            <AppText color="textMuted" style={styles.sectionDescription} variant="bodySmall">
              İsteğe bağlıdır ve yalnızca işletme yönetiminde görünür.
            </AppText>
            <TextInput
              maxLength={500}
              multiline
              onChangeText={(value) => {
                setNote(value);
                setError(null);
              }}
              placeholder={type === 'BREAK' ? 'Örn. Öğle molası' : 'Örn. Yıllık izin'}
              placeholderTextColor={colors.textMuted}
              style={styles.noteInput}
              value={note}
            />
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <AppText color="danger" variant="bodySmall">{error}</AppText>
            </View>
          ) : null}

          <AppButton disabled={isSubmitting} onPress={() => void handleSubmit()}>
            {isSubmitting ? 'Kaydediliyor...' : type === 'BREAK' ? 'Molayı Kaydet' : 'İzni Kaydet'}
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>

      {datePickerOpen ? (
        <DatePickerModal
          label={pickerTarget === 'endDate' ? 'Bitiş tarihi' : 'Başlangıç tarihi'}
          minDate={pickerTarget === 'endDate' ? startDate : minDate}
          onClose={() => setPickerTarget(null)}
          onSelect={selectDate}
          value={datePickerValue}
        />
      ) : null}

      {timePickerOpen ? (
        <TimePickerModal
          label={pickerTarget === 'endTime' ? 'Bitiş saati' : 'Başlangıç saati'}
          onClose={() => setPickerTarget(null)}
          onSelect={selectTime}
          value={timePickerValue}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, lineHeight: 24 },
  sectionDescription: { marginBottom: spacing.sm, marginTop: 2 },
  fieldRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  field: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 72,
    padding: spacing.sm,
  },
  fieldIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  fieldCopy: { flex: 1, marginHorizontal: spacing.xs },
  fieldValue: { marginTop: 1 },
  sameDayField: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.md,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 96,
    padding: spacing.md,
    textAlignVertical: 'top',
  },
  errorCard: {
    backgroundColor: '#F8E7E3',
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.sm,
  },
  pressed: { opacity: 0.68 },
});
