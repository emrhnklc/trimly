import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type HomeQuickAction = {
  description: string;
  icon: SymbolViewProps['name'];
  id: string;
  label: string;
  onPress?: () => void;
};

export function HomeQuickActions({ actions }: { actions: HomeQuickAction[] }) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}>
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
          <View style={styles.iconBox}>
            <SymbolView name={action.icon} size={20} tintColor={colors.primary} />
          </View>
          <AppText numberOfLines={2} style={styles.label} variant="label">{action.label}</AppText>
          <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
            {action.description}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingRight: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 118,
    padding: spacing.sm,
    width: 132,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.68 },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  label: { marginTop: spacing.xs },
  description: { fontSize: 10, lineHeight: 14, marginTop: spacing.xxs },
});
