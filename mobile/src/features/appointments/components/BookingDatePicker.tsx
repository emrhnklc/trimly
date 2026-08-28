import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type BookingDateOption = {
  date: string;
  dayLabel: string;
  dayNumber: string;
  monthLabel: string;
};

type BookingDatePickerProps = {
  dates: BookingDateOption[];
  onSelect: (date: string) => void;
  selectedDate: string;
};

export function BookingDatePicker({ dates, onSelect, selectedDate }: BookingDatePickerProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}>
      {dates.map((item) => {
        const isSelected = item.date === selectedDate;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            key={item.date}
            onPress={() => onSelect(item.date)}
            style={[styles.date, isSelected && styles.selectedDate]}>
            <AppText color={isSelected ? 'onPrimary' : 'textMuted'} variant="bodySmall">
              {item.dayLabel}
            </AppText>
            <AppText color={isSelected ? 'onPrimary' : 'text'} style={styles.dayNumber} variant="heading">
              {item.dayNumber}
            </AppText>
            <AppText color={isSelected ? 'onPrimary' : 'textMuted'} variant="bodySmall">
              {item.monthLabel}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xs, paddingRight: spacing.lg },
  date: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minWidth: 68,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectedDate: { backgroundColor: colors.darkSurface, borderColor: colors.darkSurface },
  dayNumber: { marginVertical: 2 },
});
