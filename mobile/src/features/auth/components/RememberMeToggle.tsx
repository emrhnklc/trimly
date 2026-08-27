import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type RememberMeToggleProps = {
  onValueChange: (value: boolean) => void;
  value: boolean;
};

export function RememberMeToggle({ onValueChange, value }: RememberMeToggleProps) {
  return (
    <Pressable
      accessibilityLabel="Beni hatırla"
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={[styles.checkbox, value && styles.checkboxSelected]}>
        {value ? (
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={14}
            tintColor={colors.onPrimary}
          />
        ) : null}
      </View>
      <AppText variant="bodySmall">Beni hatırla</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.72 },
});
