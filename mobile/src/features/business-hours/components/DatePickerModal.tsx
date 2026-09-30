import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { parseDateKey, toDateKey } from '../date';

const weekdayLabels = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

function buildMonthDays(displayedMonth: Date) {
  const year = displayedMonth.getUTCFullYear();
  const month = displayedMonth.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1, 12));
  const leadingEmptyCount = (firstDay.getUTCDay() + 6) % 7;
  const dayCount = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();

  return [
    ...Array.from({ length: leadingEmptyCount }, () => null),
    ...Array.from({ length: dayCount }, (_, index) =>
      new Date(Date.UTC(year, month, index + 1, 12)),
    ),
  ];
}

export function DatePickerModal({
  label,
  minDate,
  onClose,
  onSelect,
  value,
}: {
  label: string;
  minDate: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  value: string;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [displayedMonth, setDisplayedMonth] = useState(() => {
    const selectedDate = parseDateKey(value);
    return new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1, 12));
  });
  const days = useMemo(() => buildMonthDays(displayedMonth), [displayedMonth]);
  const previousDisabled = monthKey(displayedMonth) <= minDate.slice(0, 7);
  const monthLabel = new Intl.DateTimeFormat('tr-TR', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(displayedMonth);

  function changeMonth(amount: number) {
    setDisplayedMonth(
      (current) =>
        new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + amount, 1, 12)),
    );
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Tarih seçimini kapat"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[
          styles.sheet,
          { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, spacing.md) },
        ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText style={styles.title} variant="heading">{label}</AppText>

          <View style={styles.monthNavigation}>
            <Pressable
              accessibilityLabel="Önceki ay"
              accessibilityRole="button"
              disabled={previousDisabled}
              onPress={() => changeMonth(-1)}
              style={({ pressed }) => [
                styles.navigationButton,
                { backgroundColor: colors.surfaceMuted },
                previousDisabled && styles.disabled,
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                size={19}
                tintColor={colors.text}
              />
            </Pressable>
            <AppText style={styles.monthLabel} variant="label">{monthLabel}</AppText>
            <Pressable
              accessibilityLabel="Sonraki ay"
              accessibilityRole="button"
              onPress={() => changeMonth(1)}
              style={({ pressed }) => [
                styles.navigationButton,
                { backgroundColor: colors.surfaceMuted },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={19}
                tintColor={colors.text}
              />
            </Pressable>
          </View>

          <View style={styles.weekdays}>
            {weekdayLabels.map((weekday) => (
              <AppText color="textMuted" key={weekday} style={styles.weekday} variant="label">
                {weekday}
              </AppText>
            ))}
          </View>

          <View style={styles.days}>
            {days.map((date, index) => {
              if (!date) return <View key={`empty-${index}`} style={styles.dayShell} />;

              const dateKey = toDateKey(date);
              const selected = dateKey === value;
              const disabled = dateKey < minDate;
              return (
                <View key={dateKey} style={styles.dayShell}>
                  <Pressable
                    accessibilityLabel={dateKey}
                    accessibilityRole="button"
                    accessibilityState={{ disabled, selected }}
                    disabled={disabled}
                    onPress={() => onSelect(dateKey)}
                    style={({ pressed }) => [
                      styles.dayButton,
                      selected && { backgroundColor: colors.primary },
                      disabled && styles.disabled,
                      pressed && styles.pressed,
                    ]}>
                    <AppText color={selected ? 'onPrimary' : 'text'} variant="label">
                      {date.getUTCDate()}
                    </AppText>
                  </Pressable>
                </View>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.surfaceMuted },
              pressed && styles.pressed,
            ]}>
            <AppText variant="label">Vazgeç</AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(30, 24, 20, 0.42)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 44,
  },
  title: { textAlign: 'center' },
  monthNavigation: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  navigationButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  monthLabel: { fontSize: 15, lineHeight: 20, textTransform: 'capitalize' },
  weekdays: { flexDirection: 'row', marginTop: spacing.md },
  weekday: { textAlign: 'center', width: '14.285%' },
  days: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
  dayShell: { alignItems: 'center', height: 46, justifyContent: 'center', width: '14.285%' },
  dayButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  closeButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 48,
  },
  disabled: { opacity: 0.32 },
  pressed: { opacity: 0.68 },
});
