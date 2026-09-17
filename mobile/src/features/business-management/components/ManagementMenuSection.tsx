import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type ManagementMenuItem = {
  description: string;
  icon: SymbolViewProps['name'];
  id: string;
  onPress?: () => void;
  title: string;
  value: string;
};

export function ManagementMenuSection({ items }: { items: ManagementMenuItem[] }) {
  const themeColors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
      {items.map((item, index) => {
        return (
          <Pressable
            accessibilityRole={item.onPress ? 'button' : undefined}
            disabled={!item.onPress}
            key={item.id}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.row,
              index < items.length - 1 && { borderBottomColor: themeColors.border, borderBottomWidth: StyleSheet.hairlineWidth },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.iconShell, { backgroundColor: themeColors.background }]}>
              <SymbolView name={item.icon} size={22} tintColor={themeColors.primary} />
            </View>
            <View style={styles.content}>
              <AppText style={styles.title} variant="label">{item.title}</AppText>
            </View>
            <View style={[styles.valueBadge, { backgroundColor: themeColors.surfaceMuted }]}>
              <AppText color="primary" numberOfLines={1} style={styles.value} variant="label">
                {item.value}
              </AppText>
            </View>
            {item.onPress ? (
              <View style={[styles.chevronShell, { backgroundColor: themeColors.background }]}>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                  tintColor={themeColors.textMuted}
                />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 72, padding: spacing.sm },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  title: { fontSize: 15, lineHeight: 20 },
  valueBadge: {
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
    flexShrink: 1,
    maxWidth: 116,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  value: { fontSize: 11, lineHeight: 15 },
  chevronShell: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 34,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    width: 30,
  },
  pressed: { opacity: 0.68 },
});
