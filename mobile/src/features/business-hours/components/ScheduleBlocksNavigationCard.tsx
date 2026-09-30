import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function ScheduleBlocksNavigationCard({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconShell, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView
          name={{ ios: 'cup.and.saucer', android: 'free_breakfast', web: 'free_breakfast' }}
          size={22}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">Mola ve izinler</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          Tekrarlanmayan mola, izin ve tatil zamanlarını yönet
        </AppText>
      </View>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm, minWidth: 0 },
  description: { marginTop: 2 },
  pressed: { opacity: 0.68 },
});
