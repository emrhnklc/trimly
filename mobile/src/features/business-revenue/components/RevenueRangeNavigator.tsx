import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function RevenueRangeNavigator({
  canGoNext,
  label,
  onNext,
  onPrevious,
}: {
  canGoNext: boolean;
  label: string;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Önceki dönem"
        accessibilityRole="button"
        onPress={onPrevious}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          size={18}
          tintColor={colors.text}
        />
      </Pressable>
      <AppText style={styles.label} variant="label">{label}</AppText>
      <Pressable
        accessibilityLabel="Sonraki dönem"
        accessibilityRole="button"
        disabled={!canGoNext}
        onPress={onNext}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: colors.surface, borderColor: colors.border },
          !canGoNext && styles.disabled,
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={18}
          tintColor={colors.text}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  label: { fontSize: 14, lineHeight: 19, textTransform: 'capitalize' },
  disabled: { opacity: 0.3 },
  pressed: { opacity: 0.65 },
});
