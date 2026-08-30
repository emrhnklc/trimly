import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function EmployeeSchedulesCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconShell}>
        <SymbolView
          name={{ ios: 'person.2', android: 'groups', web: 'groups' }}
          size={22}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">Çalışan vardiyaları</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          Her çalışanın gün ve saatlerini ayrı düzenle
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  description: { marginTop: 2 },
  pressed: { opacity: 0.68 },
});
