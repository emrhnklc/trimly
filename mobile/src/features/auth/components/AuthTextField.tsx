import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type AuthTextFieldProps = TextInputProps & {
  icon: SymbolViewProps['name'];
  label: string;
  showPasswordToggle?: boolean;
};

export function AuthTextField({
  icon,
  label,
  secureTextEntry,
  showPasswordToggle = false,
  style,
  ...props
}: AuthTextFieldProps) {
  const colors = useThemeColors();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View style={[
        styles.inputShell,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}>
        <SymbolView name={icon} size={19} tintColor={colors.textMuted} />
        <TextInput
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }, style]}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {showPasswordToggle ? (
          <Pressable
            accessibilityLabel={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => setPasswordVisible((current) => !current)}
          >
            <SymbolView
              name={{
                ios: isPasswordVisible ? 'eye.slash' : 'eye',
                android: isPasswordVisible ? 'visibility_off' : 'visibility',
                web: isPasswordVisible ? 'visibility_off' : 'visibility',
              }}
              size={19}
              tintColor={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.sm },
  inputShell: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
