import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function ManagementMetricCard({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      <View style={[styles.iconShell, { backgroundColor: themeColors.surfaceMuted }]}>
        <SymbolView name={icon} size={18} tintColor={themeColors.primary} />
      </View>
      <AppText style={styles.value} variant="heading">{value}</AppText>
      <AppText color="textMuted" style={styles.label} variant="bodySmall">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    flexBasis: '46%',
    minHeight: 108,
    padding: spacing.sm,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  value: { fontSize: 28, lineHeight: 34, marginTop: spacing.sm },
  label: { fontSize: 11, lineHeight: 15, marginTop: 1 },
});
