import { SymbolView } from 'expo-symbols';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessVisibilityCard({
  onChange,
  value,
}: {
  onChange: (value: boolean) => void;
  value: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconShell, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView
          name={{ ios: value ? 'eye' : 'eye.slash', android: value ? 'visibility' : 'visibility_off', web: value ? 'visibility' : 'visibility_off' }}
          size={21}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">Arama ve keşfette göster</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          Kapalıyken işletme listelerde görünmez; özel link ve QR ile erişim devam eder.
        </AppText>
      </View>
      <Switch
        accessibilityLabel="İşletme keşif görünürlüğü"
        ios_backgroundColor={colors.border}
        onValueChange={onChange}
        thumbColor={colors.onPrimary}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  description: { marginTop: 2 },
});
