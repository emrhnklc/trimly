import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessCustomerSearch({
  onChangeText,
  value,
}: {
  onChangeText: (value: string) => void;
  value: string;
}) {
  const themeColors = useThemeColors();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.surface, borderColor: themeColors.border },
      ]}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={18}
        tintColor={themeColors.textMuted}
      />
      <TextInput
        accessibilityLabel="Müşteri ara"
        autoCapitalize="words"
        autoCorrect={false}
        clearButtonMode="while-editing"
        onChangeText={onChangeText}
        placeholder="İsim veya telefon ara"
        placeholderTextColor={themeColors.textMuted}
        returnKeyType="search"
        style={[styles.input, { color: themeColors.text }]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 13,
    paddingVertical: 0,
  },
});
