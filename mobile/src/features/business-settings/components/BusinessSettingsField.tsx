import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessSettingsField({
  helper,
  icon,
  label,
  multiline,
  style,
  ...props
}: TextInputProps & {
  helper?: string;
  icon: SymbolViewProps['name'];
  label: string;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      {helper ? (
        <AppText color="textMuted" style={styles.helper} variant="bodySmall">{helper}</AppText>
      ) : null}
      <View style={[styles.inputShell, multiline && styles.multilineShell]}>
        <SymbolView name={icon} size={19} tintColor={colors.primary} />
        <TextInput
          multiline={multiline}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, multiline && styles.multilineInput, style]}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginTop: spacing.md },
  helper: { marginTop: 2 },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  multilineShell: { alignItems: 'flex-start', paddingTop: spacing.md },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  multilineInput: { minHeight: 96, paddingTop: 0, textAlignVertical: 'top' },
});
