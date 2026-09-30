import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import {
  formatCalendarMonth,
  formatCalendarWeekday,
  getDayNumber,
  getWeekDateKeys,
  shiftDateKey,
} from '../date';

type CalendarWeekPickerProps = {
  onChange: (dateKey: string) => void;
  selectedDateKey: string;
  todayKey: string;
};

export function CalendarWeekPicker({
  onChange,
  selectedDateKey,
  todayKey,
}: CalendarWeekPickerProps) {
  const themeColors = useThemeColors();
  const dates = getWeekDateKeys(selectedDateKey);
  const isPast = selectedDateKey < todayKey;
  const isFuture = selectedDateKey > todayKey;

  const todayButton = (
    <Pressable
      accessibilityLabel="Bugüne dön"
      disabled={selectedDateKey === todayKey}
      onPress={() => onChange(todayKey)}
      style={({ pressed }) => [styles.todayButton, pressed && styles.pressed]}>
      {selectedDateKey !== todayKey ? (
        <AppText color="primary" style={styles.jumpTodayLabel} variant="label">Bugün</AppText>
      ) : null}
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={styles.monthRow}>
        <View style={styles.todaySlot}>{isFuture ? todayButton : null}</View>
        <Pressable
          accessibilityLabel="Önceki hafta"
          hitSlop={10}
          onPress={() => onChange(shiftDateKey(selectedDateKey, -7))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={18}
            tintColor={themeColors.text}
          />
        </Pressable>
        <AppText style={styles.month} variant="label">
          {formatCalendarMonth(selectedDateKey)}
        </AppText>
        <Pressable
          accessibilityLabel="Sonraki hafta"
          hitSlop={10}
          onPress={() => onChange(shiftDateKey(selectedDateKey, 7))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={18}
            tintColor={themeColors.text}
          />
        </Pressable>
        <View style={styles.todaySlot}>{isPast ? todayButton : null}</View>
      </View>

      <View style={styles.days}>
        {dates.map((dateKey) => {
          const selected = dateKey === selectedDateKey;
          const today = dateKey === todayKey;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={dateKey}
              onPress={() => onChange(dateKey)}
              style={({ pressed }) => [
                styles.day,
                selected && { backgroundColor: themeColors.primary },
                pressed && styles.pressed,
              ]}>
              <AppText
                color={selected ? 'onPrimary' : 'textMuted'}
                style={styles.weekday}
                variant="bodySmall">
                {formatCalendarWeekday(dateKey)}
              </AppText>
              <AppText
                color={selected ? 'onPrimary' : 'text'}
                style={styles.dayNumber}
                variant="label">
                {getDayNumber(dateKey)}
              </AppText>
              <AppText
                color={selected ? 'onPrimary' : today ? 'primary' : 'textMuted'}
                style={[styles.todayLabel, !today && styles.hiddenTodayLabel]}
                variant="bodySmall">
                Bugün
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  monthRow: { alignItems: 'center', flexDirection: 'row', minHeight: 32 },
  todaySlot: { alignItems: 'center', minWidth: 44 },
  todayButton: { alignItems: 'center', justifyContent: 'center', minHeight: 30, minWidth: 44 },
  jumpTodayLabel: { fontSize: 10, lineHeight: 14 },
  arrow: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  month: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  todayLabel: { fontSize: 9, lineHeight: 12, marginTop: 2 },
  hiddenTodayLabel: { opacity: 0 },
  days: { flexDirection: 'row', gap: 3, marginTop: spacing.xs },
  day: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 66,
    paddingVertical: 6,
  },
  weekday: { fontSize: 10, lineHeight: 14, textTransform: 'capitalize' },
  dayNumber: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  pressed: { opacity: 0.7 },
});
