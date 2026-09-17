import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type BusinessCustomerFilter = 'all' | 'regular' | 'new';

const filters: { label: string; value: BusinessCustomerFilter }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Düzenli', value: 'regular' },
  { label: 'Yeni', value: 'new' },
];

export function BusinessCustomerFilters({
  onChange,
  value,
}: {
  onChange: (value: BusinessCustomerFilter) => void;
  value: BusinessCustomerFilter;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={[styles.container, { borderColor: themeColors.border }]}>
      {filters.map((filter) => {
        const selected = value === filter.value;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={({ pressed }) => [
              styles.filter,
              selected && { backgroundColor: themeColors.primary },
              pressed && styles.pressed,
            ]}>
            <AppText
              color={selected ? 'onPrimary' : 'textMuted'}
              style={styles.label}
              variant="label">
              {filter.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: 4,
  },
  filter: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 34,
  },
  label: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
