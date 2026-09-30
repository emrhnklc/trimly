import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { ScheduleBlockType } from '@/features/schedules/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

const options: {
  icon: SymbolViewProps['name'];
  label: string;
  value: ScheduleBlockType;
}[] = [
  {
    icon: { ios: 'cup.and.saucer', android: 'free_breakfast', web: 'free_breakfast' },
    label: 'Mola',
    value: 'BREAK',
  },
  {
    icon: { ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' },
    label: 'İzin',
    value: 'TIME_OFF',
  },
];

export function ScheduleBlockTypeSelector({
  onChange,
  value,
}: {
  onChange: (value: ScheduleBlockType) => void;
  value: ScheduleBlockType;
}) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: colors.surface,
                borderColor: selected ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}>
            <View style={[
              styles.iconShell,
              { backgroundColor: selected ? colors.surfaceMuted : colors.background },
            ]}>
              <SymbolView name={option.icon} size={21} tintColor={colors.primary} />
            </View>
            <AppText style={styles.label} variant="label">{option.label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    minHeight: 106,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  label: { marginTop: spacing.sm },
  pressed: { opacity: 0.68 },
});
