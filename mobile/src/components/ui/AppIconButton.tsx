import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type AppIconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  accessibilityLabel: string;
  color?: keyof typeof colors;
  icon: SymbolViewProps['name'];
  size?: number;
  variant?: 'primary' | 'surface' | 'transparent';
};

export function AppIconButton({
  accessibilityLabel,
  color = 'text',
  disabled,
  icon,
  size = 22,
  variant = 'surface',
  ...props
}: AppIconButtonProps) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        variant === 'surface' && {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
          borderWidth: 1,
        },
        variant === 'primary' && {
          backgroundColor: themeColors.primary,
          borderColor: themeColors.primary,
          borderWidth: 1,
        },
        variant === 'transparent' && styles.transparent,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...props}>
      <View pointerEvents="none">
        <SymbolView name={icon} size={size} tintColor={themeColors[color]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  transparent: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
