import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

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
  const colors = useThemeColors();
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
            style={[
              styles.date,
              {
                backgroundColor: isSelected ? colors.darkSurface : colors.surface,
                borderColor: isSelected ? colors.darkSurface : colors.border,
              },
            ]}>
            <AppText color={isSelected ? 'onPrimary' : 'textMuted'} variant="bodySmall">
              {item.dayLabel}
            </AppText>
            <AppText color={isSelected ? 'onPrimary' : 'text'} style={styles.dayNumber} variant="label">
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
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 58,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dayNumber: { fontSize: 17, lineHeight: 22, marginVertical: 1 },
});
