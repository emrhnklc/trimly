import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type MemberStatusFilter = 'all' | 'active' | 'inactive';

const filters: { label: string; value: MemberStatusFilter }[] = [
  { label: 'Tümü', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Pasif', value: 'inactive' },
];

export function MemberStatusFilters({
  onChange,
  value,
}: {
  onChange: (value: MemberStatusFilter) => void;
  value: MemberStatusFilter;
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
            style={({ pressed }) => [styles.filter, selected && styles.selected, pressed && styles.pressed]}>
            <AppText color={selected ? 'onPrimary' : 'textMuted'} style={styles.label} variant="label">
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
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: 4,
  },
  filter: { alignItems: 'center', borderRadius: radius.sm, flex: 1, justifyContent: 'center', minHeight: 36 },
  selected: { backgroundColor: colors.darkSurface },
  label: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
