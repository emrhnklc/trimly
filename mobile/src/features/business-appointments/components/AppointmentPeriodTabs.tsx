import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type AppointmentPeriod = 'today' | 'upcoming' | 'history';

const periods: { id: AppointmentPeriod; label: { en: string; tr: string } }[] = [
  { id: 'today', label: { en: 'Today', tr: 'Bugün' } },
  { id: 'upcoming', label: { en: 'Upcoming', tr: 'Yaklaşan' } },
  { id: 'history', label: { en: 'History', tr: 'Geçmiş' } },
];

export function AppointmentPeriodTabs({
  onChange,
  value,
}: {
  onChange: (period: AppointmentPeriod) => void;
  value: AppointmentPeriod;
}) {
  const colors = useThemeColors();
  const { language } = useAppPreferences();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {periods.map((period) => {
        const isSelected = period.id === value;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            key={period.id}
            onPress={() => onChange(period.id)}
            style={({ pressed }) => [
              styles.item,
              isSelected && { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}>
            <AppText
              color={isSelected ? 'onPrimary' : 'textMuted'}
              style={styles.label}
              variant="label">
              {period.label[language]}
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
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.xxs,
  },
  item: {
    alignItems: 'center',
    borderRadius: radius.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 36,
  },
  label: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
