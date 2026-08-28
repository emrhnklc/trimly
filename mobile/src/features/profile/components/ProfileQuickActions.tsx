import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type QuickAction = {
  icon: SymbolViewProps['name'];
  id: string;
  label: string;
  onPress?: () => void;
};

export function ProfileQuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <View>
      <SectionHeader title="Hızlı İşlemler" />
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            accessibilityLabel={action.label}
            accessibilityRole="button"
            accessibilityState={{ disabled: !action.onPress }}
            disabled={!action.onPress}
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.card,
              !action.onPress && styles.disabled,
              pressed && styles.pressed,
            ]}>
            <SymbolView name={action.icon} size={22} tintColor={colors.text} />
            <AppText numberOfLines={2} style={styles.label} variant="bodySmall">
              {action.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: spacing.xs },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 88,
    padding: spacing.xs,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.52 },
  label: { fontSize: 10, lineHeight: 14, marginTop: spacing.xs, textAlign: 'center' },
});
