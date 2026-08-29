import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type AppointmentPeriod = 'today' | 'upcoming' | 'history';

const periods: { id: AppointmentPeriod; label: string }[] = [
  { id: 'today', label: 'Bugün' },
  { id: 'upcoming', label: 'Yaklaşan' },
  { id: 'history', label: 'Geçmiş' },
];

export function AppointmentPeriodTabs({
  onChange,
  value,
}: {
  onChange: (period: AppointmentPeriod) => void;
  value: AppointmentPeriod;
}) {
  return (
    <View style={styles.container}>
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
              isSelected && styles.selectedItem,
              pressed && styles.pressed,
            ]}>
            <AppText
              color={isSelected ? 'onPrimary' : 'textMuted'}
              style={styles.label}
              variant="label">
              {period.label}
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
    borderColor: colors.border,
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
  selectedItem: { backgroundColor: colors.primary },
  label: { fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.7 },
});
