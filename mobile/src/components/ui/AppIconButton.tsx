import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, type PressableProps, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';

type AppIconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  accessibilityLabel: string;
  color?: keyof typeof colors;
  icon: SymbolViewProps['name'];
  size?: number;
  variant?: 'surface' | 'transparent';
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
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      {...props}>
      <View pointerEvents="none">
        <SymbolView name={icon} size={size} tintColor={colors[color]} />
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
  surface: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  transparent: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
