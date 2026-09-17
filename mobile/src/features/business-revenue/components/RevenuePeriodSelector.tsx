import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
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
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceMuted }]}>
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
              selected && { backgroundColor: colors.primary },
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
  pressed: { opacity: 0.7 },
});
