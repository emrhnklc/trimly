import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarbershopSearchProps = {
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  value: string;
};

export function BarbershopSearch({ onChangeText, onSubmit, value }: BarbershopSearchProps) {
  return (
    <View style={styles.row}>
      <TextInput
        accessibilityLabel="Berber ara"
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder="Berber ara"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      <AppButton onPress={onSubmit}>Ara</AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    height: 50,
    paddingHorizontal: spacing.md,
  },
});
