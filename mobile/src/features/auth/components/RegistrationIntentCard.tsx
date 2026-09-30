import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type RegistrationIntentCardProps = {
  description: string;
  icon: SymbolViewProps['name'];
  isSelected: boolean;
  onPress: () => void;
  title: string;
};

export function RegistrationIntentCard({
  description,
  icon,
  isSelected,
  onPress,
  title,
}: RegistrationIntentCardProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected ? colors.surfaceMuted : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 1.5 : 1,
        },
        pressed && styles.pressed,
      ]}>
      <View style={[
        styles.iconShell,
        { backgroundColor: isSelected ? colors.primary : colors.background },
      ]}>
        <SymbolView name={icon} size={23} tintColor={isSelected ? colors.onPrimary : colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title} variant="label">{title}</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          {description}
        </AppText>
      </View>
      <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.border }]}>
        {isSelected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 94,
    padding: spacing.md,
  },
  pressed: { opacity: 0.76 },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: { flex: 1, marginHorizontal: spacing.md },
  title: { fontSize: 15, lineHeight: 20 },
  description: { lineHeight: 18, marginTop: spacing.xxs },
  radio: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioDot: { borderRadius: radius.pill, height: 12, width: 12 },
});
