import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type LoginTextFieldProps = TextInputProps & {
  icon: SymbolViewProps['name'];
  onTrailingIconPress?: () => void;
  trailingIcon?: SymbolViewProps['name'];
  trailingIconLabel?: string;
};

export function LoginTextField({
  icon,
  onTrailingIconPress,
  style,
  trailingIcon,
  trailingIconLabel,
  ...props
}: LoginTextFieldProps) {
  return (
    <View style={styles.container}>
      <SymbolView name={icon} size={20} tintColor={colors.textMuted} />
      <TextInput
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[styles.input, style]}
        {...props}
      />
      {trailingIcon && onTrailingIconPress ? (
        <Pressable
          accessibilityLabel={trailingIconLabel}
          accessibilityRole="button"
          hitSlop={10}
          onPress={onTrailingIconPress}
          style={({ pressed }) => pressed && styles.pressed}>
          <SymbolView name={trailingIcon} size={20} tintColor={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.6 },
});
