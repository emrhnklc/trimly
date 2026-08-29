import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

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
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selectedCard,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconShell, isSelected && styles.selectedIconShell]}>
        <SymbolView name={icon} size={23} tintColor={isSelected ? colors.onPrimary : colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title} variant="label">{title}</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          {description}
        </AppText>
      </View>
      <View style={[styles.radio, isSelected && styles.selectedRadio]}>
        {isSelected ? <View style={styles.radioDot} /> : null}
      </View>
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
    minHeight: 94,
    padding: spacing.md,
  },
  selectedCard: {
    backgroundColor: '#FCF5E6',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  pressed: { opacity: 0.76 },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  selectedIconShell: { backgroundColor: colors.primary },
  copy: { flex: 1, marginHorizontal: spacing.md },
  title: { fontSize: 15, lineHeight: 20 },
  description: { lineHeight: 18, marginTop: spacing.xxs },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  selectedRadio: { borderColor: colors.primary },
  radioDot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 12, width: 12 },
});
