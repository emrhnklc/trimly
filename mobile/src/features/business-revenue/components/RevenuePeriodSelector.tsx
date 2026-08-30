import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import type { RevenuePeriod } from '../types';

const options: { label: string; value: RevenuePeriod }[] = [
  { label: 'Bu Hafta', value: 'WEEK' },
  { label: 'Bu Ay', value: 'MONTH' },
  { label: 'Bu Yıl', value: 'YEAR' },
];

export function RevenuePeriodSelector({
  onChange,
  value,
}: {
  onChange: (value: RevenuePeriod) => void;
  value: RevenuePeriod;
}) {
  return (
    <View style={styles.container}>
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
              selected && styles.selectedOption,
              pressed && styles.pressed,
            ]}>
            <AppText color={selected ? 'onPrimary' : 'textMuted'} variant="label">
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xxs,
    marginTop: spacing.lg,
    padding: spacing.xxs,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  selectedOption: { backgroundColor: colors.primary },
  pressed: { opacity: 0.7 },
});
