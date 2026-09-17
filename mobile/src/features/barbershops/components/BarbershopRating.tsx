import { StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { useThemeColors } from '@/theme/useThemeColors';

export function BarbershopRating({
  ratingAverage,
  ratingCount,
  compact = false,
}: {
  ratingAverage: number | null;
  ratingCount: number;
  compact?: boolean;
}) {
  const colors = useThemeColors();
  const hasRating = ratingAverage !== null && ratingCount > 0;

  return (
    <View style={styles.row}>
      <SymbolView
        name={{ ios: 'star.fill', android: 'star', web: 'star' }}
        size={compact ? 13 : 15}
        tintColor={colors.primary}
      />
      <AppText color={hasRating ? 'text' : 'textMuted'} style={styles.label} variant="bodySmall">
        {hasRating ? `${ratingAverage.toFixed(1)} (${ratingCount})` : 'Henüz değerlendirme yok'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  label: { fontSize: 13, lineHeight: 18 },
});
