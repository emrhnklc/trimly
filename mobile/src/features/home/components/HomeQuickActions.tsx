import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type HomeQuickAction = {
  description: string;
  icon: SymbolViewProps['name'];
  id: string;
  label: string;
  onPress?: () => void;
};

export function HomeQuickActions({ actions }: { actions: HomeQuickAction[] }) {
  const colors = useThemeColors();

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
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.pressed,
          ]}>
          <View style={styles.topRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.surfaceMuted }]}>
              <SymbolView name={action.icon} size={18} tintColor={colors.primary} />
            </View>
            <AppText numberOfLines={2} style={styles.label} variant="cardTitle">{action.label}</AppText>
          </View>
          <View style={styles.bottomRow}>
            <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
              {action.description}
            </AppText>
            {!action.onPress ? (
              <View
                style={[
                  styles.comingSoonBadge,
                  { backgroundColor: colors.background, borderColor: colors.border },
                ]}>
                <AppText color="textMuted" style={styles.comingSoonLabel} variant="label">Yakında</AppText>
              </View>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: layout.cardGap, paddingRight: spacing.lg },
  card: {
    borderRadius: radius.smallCard,
    borderWidth: 1,
    minHeight: 96,
    padding: 10,
    width: 138,
  },
  pressed: { opacity: 0.7 },
  topRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  iconBox: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  label: { flex: 1, fontSize: 14, lineHeight: 18 },
  bottomRow: { alignItems: 'flex-end', flexDirection: 'row', marginTop: 6 },
  description: { flex: 1, fontSize: 10, lineHeight: 14 },
  comingSoonBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    marginLeft: spacing.xxs,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  comingSoonLabel: { fontSize: 9, lineHeight: 12 },
});
