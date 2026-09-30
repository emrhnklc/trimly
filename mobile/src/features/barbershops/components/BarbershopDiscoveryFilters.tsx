import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type DiscoveryFilter = 'featured' | 'nearby' | 'popular' | 'new';

export const discoveryFilters: { icon: SymbolViewProps['name']; label: string; value: DiscoveryFilter }[] = [
  { icon: { ios: 'star.fill', android: 'star', web: 'star' }, label: 'Öne Çıkan', value: 'featured' },
  { icon: { ios: 'location.fill', android: 'location_on', web: 'location_on' }, label: 'Yakınımdaki', value: 'nearby' },
  { icon: { ios: 'flame.fill', android: 'local_fire_department', web: 'local_fire_department' }, label: 'Popüler', value: 'popular' },
  { icon: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }, label: 'Yeni', value: 'new' },
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
      {discoveryFilters.map((filter) => {
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
            <SymbolView
              name={filter.icon}
              size={15}
              tintColor={isActive ? themeColors.onPrimary : themeColors.textMuted}
            />
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
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  label: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.76 },
});
