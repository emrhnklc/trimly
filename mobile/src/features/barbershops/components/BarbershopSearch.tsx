import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BarbershopSearchProps = {
  onChangeText: (text: string) => void;
  onFilterPress: () => void;
  onSubmit: () => void;
  value: string;
};

export function BarbershopSearch({ onChangeText, onFilterPress, onSubmit, value }: BarbershopSearchProps) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.row}>
      <View style={[styles.inputContainer, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <SymbolView
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          size={18}
          tintColor={themeColors.textMuted}
        />
        <TextInput
          accessibilityLabel="Berber dükkânı ara"
          autoCapitalize="words"
          clearButtonMode="while-editing"
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Berber, uzmanlık veya semt ara..."
          placeholderTextColor={themeColors.textMuted}
          returnKeyType="search"
          style={[styles.input, { color: themeColors.text }]}
          value={value}
        />
      </View>
      <Pressable
        accessibilityLabel="Filtreleri aç"
        accessibilityRole="button"
        onPress={onFilterPress}
        style={({ pressed }) => [
          styles.filterButton,
          { backgroundColor: themeColors.surface, borderColor: themeColors.primary },
          pressed && styles.pressed,
        ]}>
        <SymbolView
          name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
          size={19}
          tintColor={themeColors.primary}
        />
        <AppText color="primary" style={styles.filterLabel} variant="label">Filtrele</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  inputContainer: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    height: 50,
    paddingLeft: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    height: '100%',
    paddingHorizontal: spacing.sm,
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  filterLabel: { fontSize: 13, lineHeight: 18 },
  pressed: { opacity: 0.72 },
});
