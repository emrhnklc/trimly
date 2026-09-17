import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessDetailHeader({
  actionIcon,
  actionLabel,
  onAction,
  onBack,
  title,
}: {
  actionIcon?: SymbolViewProps['name'];
  actionLabel?: string;
  onAction?: () => void;
  onBack: () => void;
  title: string;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityLabel="Geri"
        accessibilityRole="button"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          size={21}
          tintColor={themeColors.text}
        />
      </Pressable>
      <AppText numberOfLines={1} style={styles.title} variant="heading">{title}</AppText>
      {onAction && actionIcon ? (
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => [styles.side, styles.action, { backgroundColor: themeColors.surfaceMuted }, pressed && styles.pressed]}>
          <SymbolView name={actionIcon} size={21} tintColor={themeColors.primary} />
        </Pressable>
      ) : (
        <View style={styles.side} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 54 },
  side: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  action: {},
  title: { flex: 1, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  pressed: { opacity: 0.62 },
});
