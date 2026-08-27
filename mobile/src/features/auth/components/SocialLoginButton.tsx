import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type SocialLoginButtonProps = {
  onPress: () => void;
  provider: 'apple' | 'google';
};

export function SocialLoginButton({ onPress, provider }: SocialLoginButtonProps) {
  const isApple = provider === 'apple';
  const name = isApple ? 'Apple' : 'Google';

  return (
    <Pressable
      accessibilityLabel={`${name} ile devam et`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <View style={styles.iconCircle}>
        {isApple ? (
          <SymbolView
            name={{ ios: 'apple.logo', android: 'phone_iphone', web: 'phone_iphone' }}
            size={24}
            tintColor={colors.text}
          />
        ) : (
          <AppText style={styles.googleMark}>G</AppText>
        )}
      </View>
      <AppText color="textMuted" style={styles.label} variant="bodySmall">
        {name} ile devam et
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flex: 1 },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  googleMark: {
    color: '#4285F4',
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
  },
  label: { marginTop: spacing.xs, textAlign: 'center' },
  pressed: { opacity: 0.68 },
});
