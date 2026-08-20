import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { AppText } from './AppText';

type AppButtonProps = PropsWithChildren<
  Omit<PressableProps, 'style'> & {
    variant?: 'primary' | 'secondary' | 'ghost';
  }
>;

export function AppButton({ children, disabled, variant = 'primary', ...props }: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
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
    borderRadius: radius.md,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.surfaceMuted },
  ghost: { backgroundColor: 'transparent' },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
});
