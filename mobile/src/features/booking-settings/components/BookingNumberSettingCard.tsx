import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BookingNumberSettingCard({
  description,
  formatValue,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  description: string;
  formatValue: (value: number) => string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <AppText variant="label">{label}</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          {description}
        </AppText>
      </View>
      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={`${label} değerini azalt`}
          accessibilityRole="button"
          disabled={!canDecrease}
          onPress={() => onChange(Math.max(min, value - step))}
          style={({ pressed }) => [
            styles.controlButton,
            !canDecrease && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'minus', android: 'remove', web: 'remove' }}
            size={18}
            tintColor={colors.text}
          />
        </Pressable>
        <View style={styles.valueShell}>
          <AppText color="primary" style={styles.value} variant="label">
            {formatValue(value)}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel={`${label} değerini artır`}
          accessibilityRole="button"
          disabled={!canIncrease}
          onPress={() => onChange(Math.min(max, value + step))}
          style={({ pressed }) => [
            styles.controlButton,
            !canIncrease && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            size={18}
            tintColor={colors.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 104,
    padding: spacing.md,
  },
  copy: { flex: 1, paddingRight: spacing.sm },
  description: { marginTop: 2 },
  controls: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  controlButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  valueShell: { alignItems: 'center', minWidth: 68 },
  value: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  disabled: { opacity: 0.32 },
  pressed: { opacity: 0.65 },
});
