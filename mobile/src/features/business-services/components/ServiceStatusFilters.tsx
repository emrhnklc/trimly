import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type ServiceStatusFilter = 'all' | 'active' | 'inactive';

const filters: { label: string; value: ServiceStatusFilter }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' },
];

export function ServiceStatusFilters({
  onChange,
  value,
}: {
  onChange: (value: ServiceStatusFilter) => void;
  value: ServiceStatusFilter;
}) {
  return (
    <View style={styles.container}>
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
              selected && styles.selected,
              pressed && styles.pressed,
            ]}>
            <AppText
              color={selected ? 'text' : 'textMuted'}
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
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: 4,
  },
  filter: { alignItems: 'center', borderRadius: radius.sm, flex: 1, minHeight: 36, justifyContent: 'center' },
  selected: { backgroundColor: colors.surfaceMuted },
  label: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
