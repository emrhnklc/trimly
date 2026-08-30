import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type ManagementMenuItem = {
  description: string;
  icon: SymbolViewProps['name'];
  id: string;
  title: string;
  value: string;
};

export function ManagementMenuSection({ items }: { items: ManagementMenuItem[] }) {
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View
          key={item.id}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}>
          <View style={styles.iconShell}>
            <SymbolView name={item.icon} size={19} tintColor={colors.primary} />
          </View>
          <View style={styles.content}>
            <View style={styles.titleRow}>
              <AppText style={styles.title} variant="label">{item.title}</AppText>
              <AppText color="primary" numberOfLines={1} style={styles.value} variant="label">
                {item.value}
              </AppText>
            </View>
            <AppText color="textMuted" numberOfLines={1} style={styles.description} variant="bodySmall">
              {item.description}
            </AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 76, padding: spacing.sm },
  rowBorder: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  content: { flex: 1, marginLeft: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row' },
  title: { flex: 1, fontSize: 13, lineHeight: 18 },
  value: { fontSize: 10, lineHeight: 14, marginLeft: spacing.xs, maxWidth: 130 },
  description: { fontSize: 10, lineHeight: 14, marginTop: 2 },
});
