import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

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
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { borderColor: colors.border }]}>
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
              selected && { backgroundColor: colors.darkSurface },
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
    marginTop: spacing.md,
    padding: 4,
  },
  filter: { alignItems: 'center', borderRadius: radius.sm, flex: 1, minHeight: 36, justifyContent: 'center' },
  label: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
