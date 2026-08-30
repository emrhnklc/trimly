import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const intervals = [5, 10, 15, 30] as const;

export function BookingSlotIntervalCard({
  onChange,
  value,
}: {
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <View style={styles.card}>
      <AppText variant="label">Randevu başlangıç aralığı</AppText>
      <AppText color="textMuted" style={styles.description} variant="bodySmall">
        Müşteriye gösterilecek başlangıç saatlerinin kaç dakikada bir üretileceğini belirler.
      </AppText>
      <View style={styles.options}>
        {intervals.map((interval) => {
          const selected = interval === value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={interval}
              onPress={() => onChange(interval)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selectedOption,
                pressed && styles.pressed,
              ]}>
              <AppText color={selected ? 'onPrimary' : 'text'} variant="label">
                {interval} dk
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  description: { marginTop: 2 },
  options: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md },
  option: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  selectedOption: { backgroundColor: colors.primary, borderColor: colors.primary },
  pressed: { opacity: 0.68 },
});
