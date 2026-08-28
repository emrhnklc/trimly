import { StyleSheet, TextInput, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarbershopSearchProps = {
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  onSubmit: () => void;
  value: string;
};

export function BarbershopSearch({ onChangeText, onFilterPress, onSubmit, value }: BarbershopSearchProps) {
  return (
    <View style={styles.row}>
      <View style={styles.inputContainer}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={18}
          tintColor={colors.textMuted}
        />
        <TextInput
          accessibilityLabel="Berber dükkânı ara"
          autoCapitalize="words"
          clearButtonMode="while-editing"
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Berber, uzmanlık veya semt ara..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={value}
        />
      </View>
      <AppIconButton
        accessibilityLabel="Filtreleri aç"
        icon={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
        onPress={onFilterPress}
        variant="surface"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  inputContainer: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 50,
    paddingLeft: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    height: '100%',
    paddingHorizontal: spacing.sm,
  },
});
