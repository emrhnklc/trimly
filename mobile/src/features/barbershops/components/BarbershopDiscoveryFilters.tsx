import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

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
  const themeColors = useThemeColors();
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
              {
                backgroundColor: isActive ? themeColors.primary : themeColors.surface,
                borderColor: isActive ? themeColors.primary : themeColors.border,
              },
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
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  label: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.76 },
});
