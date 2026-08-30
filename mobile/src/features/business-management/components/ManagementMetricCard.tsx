import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ManagementMetricCard({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView name={icon} size={18} tintColor={colors.primary} />
      </View>
      <AppText style={styles.value} variant="heading">{value}</AppText>
      <AppText color="textMuted" style={styles.label} variant="bodySmall">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    flexBasis: '46%',
    minHeight: 112,
    padding: spacing.sm,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  value: { fontSize: 20, lineHeight: 26, marginTop: spacing.sm },
  label: { fontSize: 10, lineHeight: 14, marginTop: 1 },
});
