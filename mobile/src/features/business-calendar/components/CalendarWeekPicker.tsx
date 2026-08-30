import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
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
  const dates = getWeekDateKeys(selectedDateKey);

  return (
    <View style={styles.container}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityLabel="Önceki hafta"
          hitSlop={10}
          onPress={() => onChange(shiftDateKey(selectedDateKey, -7))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={18}
            tintColor={colors.text}
          />
        </Pressable>
        <AppText style={styles.month} variant="label">
          {formatCalendarMonth(selectedDateKey)}
        </AppText>
        {selectedDateKey !== todayKey ? (
          <Pressable onPress={() => onChange(todayKey)} style={styles.todayButton}>
            <AppText color="primary" style={styles.todayLabel} variant="label">Bugün</AppText>
          </Pressable>
        ) : (
          <View style={styles.todayButton} />
        )}
        <Pressable
          accessibilityLabel="Sonraki hafta"
          hitSlop={10}
          onPress={() => onChange(shiftDateKey(selectedDateKey, 7))}
          style={({ pressed }) => [styles.arrow, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={18}
            tintColor={colors.text}
          />
        </Pressable>
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
                selected && styles.selectedDay,
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
              <View style={[styles.todayDot, today && !selected && styles.visibleTodayDot]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  monthRow: { alignItems: 'center', flexDirection: 'row', minHeight: 32 },
  arrow: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  month: { flex: 1, textAlign: 'center', textTransform: 'capitalize' },
  todayButton: { alignItems: 'flex-end', minWidth: 48 },
  todayLabel: { fontSize: 11, lineHeight: 15 },
  days: { flexDirection: 'row', gap: 3, marginTop: spacing.xs },
  day: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 62,
    paddingVertical: 6,
  },
  selectedDay: { backgroundColor: colors.darkSurface },
  weekday: { fontSize: 10, lineHeight: 14, textTransform: 'capitalize' },
  dayNumber: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  todayDot: { borderRadius: radius.pill, height: 3, marginTop: 3, width: 3 },
  visibleTodayDot: { backgroundColor: colors.primary },
  pressed: { opacity: 0.7 },
});
