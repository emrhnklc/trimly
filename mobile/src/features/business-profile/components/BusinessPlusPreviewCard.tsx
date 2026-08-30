import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessPlusPreviewCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Trimly Plus hakkında bilgi al"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconBox}>
        <SymbolView
          name={{ ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' }}
          size={24}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText style={styles.title} variant="label">Trimly Plus</AppText>
          <View style={styles.badge}>
            <AppText color="primary" style={styles.badgeText} variant="overline">YAKINDA</AppText>
          </View>
        </View>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          İşletmene özel yeni avantajlar hazırlanıyor.
        </AppText>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={17}
        tintColor={colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#FFF8E8',
    borderColor: '#E9CA79',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.md,
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: '#FBF0D2',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  title: { fontSize: 13, lineHeight: 18 },
  badge: {
    backgroundColor: colors.surface,
    borderColor: '#E9CA79',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 8, lineHeight: 10 },
  description: { fontSize: 11, lineHeight: 16, marginTop: 1 },
  pressed: { opacity: 0.7 },
});
