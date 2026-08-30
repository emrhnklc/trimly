import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessSettingsField({
  helper,
  horizontal = false,
  icon,
  label,
  multiline,
  style,
  ...props
}: TextInputProps & {
  helper?: string;
  horizontal?: boolean;
  icon: SymbolViewProps['name'];
  label: string;
}) {
  if (horizontal) {
    return (
      <View style={styles.horizontalField}>
        <AppText style={styles.horizontalLabel} variant="label">{label}</AppText>
        <View style={[styles.inputShell, styles.horizontalInputShell]}>
          <SymbolView name={icon} size={18} tintColor={colors.text} />
          <TextInput
            multiline={multiline}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            style={[styles.input, styles.horizontalInput, style]}
            {...props}
          />
        </View>
      </View>
    );
  }

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
  field: { marginTop: spacing.sm },
  helper: { marginTop: 2 },
  inputShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  multilineShell: { alignItems: 'flex-start', paddingTop: spacing.md },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  multilineInput: { minHeight: 72, paddingTop: 0, textAlignVertical: 'top' },
  horizontalField: { alignItems: 'center', flexDirection: 'row', paddingVertical: spacing.xs },
  horizontalLabel: { fontSize: 12, lineHeight: 16, width: 108 },
  horizontalInputShell: { flex: 1, marginTop: 0 },
  horizontalInput: { minHeight: 42 },
});
