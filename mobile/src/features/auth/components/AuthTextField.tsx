import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

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
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.inputShell}>
        <SymbolView name={icon} size={19} tintColor={colors.textMuted} />
        <TextInput
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, style]}
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
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
