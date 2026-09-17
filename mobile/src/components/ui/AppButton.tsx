import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';

import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { AppText } from './AppText';

type AppButtonProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    variant?: 'primary' | 'secondary' | 'ghost';
  }
>;

export function AppButton({ children, disabled, variant = 'primary', ...props }: AppButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.surfaceMuted },
        variant === 'ghost' && styles.ghost,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...props}>
      <View pointerEvents="none">
        <AppText color={variant === 'primary' ? 'onPrimary' : 'text'} style={styles.label}>
          {children}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.card,
    justifyContent: 'center',
    minHeight: layout.primaryButtonHeight,
    paddingHorizontal: spacing.lg,
  },
  ghost: { backgroundColor: 'transparent' },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
