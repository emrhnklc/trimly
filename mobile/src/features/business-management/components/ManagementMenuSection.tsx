import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type ManagementMenuItem = {
  description: string;
  icon: SymbolViewProps['name'];
  id: string;
  onPress?: () => void;
  title: string;
  value: string;
};

export function ManagementMenuSection({ items }: { items: ManagementMenuItem[] }) {
  return (
    <View style={styles.container}>
      {items.map((item, index) => {
        return (
          <Pressable
            accessibilityRole={item.onPress ? 'button' : undefined}
            disabled={!item.onPress}
            key={item.id}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.row,
              index < items.length - 1 && styles.rowBorder,
              pressed && styles.pressed,
            ]}>
            <View style={styles.iconShell}>
              <SymbolView name={item.icon} size={22} tintColor={colors.primary} />
            </View>
            <View style={styles.content}>
              <AppText style={styles.title} variant="label">{item.title}</AppText>
              <AppText
                color="textMuted"
                numberOfLines={2}
                style={styles.description}
                variant="bodySmall">
                {item.description}
              </AppText>
            </View>
            <View style={styles.valueBadge}>
              <AppText color="primary" numberOfLines={1} style={styles.value} variant="label">
                {item.value}
              </AppText>
            </View>
            {item.onPress ? (
              <View style={styles.chevronShell}>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={16}
                  tintColor={colors.textMuted}
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 98, padding: spacing.sm },
  rowBorder: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  content: { flex: 1, marginLeft: spacing.sm },
  title: { fontSize: 15, lineHeight: 20 },
  description: { marginTop: 3, paddingRight: spacing.xs },
  valueBadge: {
    backgroundColor: '#FBF3DE',
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
    maxWidth: 104,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  value: { fontSize: 12, lineHeight: 16 },
  chevronShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    width: 34,
  },
  pressed: { opacity: 0.68 },
});
