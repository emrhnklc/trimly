import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type DiscoveryFilter = 'featured' | 'nearby' | 'popular' | 'new';

const filters: { label: string; value: DiscoveryFilter }[] = [
  { label: 'Öne Çıkan', value: 'featured' },
  { label: 'Yakınımdaki', value: 'nearby' },
  { label: 'Popüler', value: 'popular' },
  { label: 'Yeni', value: 'new' },
];

export function BarbershopDiscoveryFilters({
  activeFilter,
  onChange,
}: {
  activeFilter: DiscoveryFilter;
  onChange: (filter: DiscoveryFilter) => void;
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}>
      {filters.map((filter) => {
        const isActive = filter.value === activeFilter;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={({ pressed }) => [
              styles.filter,
              isActive && styles.activeFilter,
              pressed && styles.pressed,
            ]}>
            <AppText color={isActive ? 'onPrimary' : 'text'} style={styles.label} variant="bodySmall">
              {filter.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xs, paddingRight: spacing.lg },
  filter: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  activeFilter: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.76 },
});
