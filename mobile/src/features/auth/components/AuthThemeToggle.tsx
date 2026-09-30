import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { radius } from '@/theme/spacing';

export function AuthThemeToggle() {
  const { resolvedTheme, setThemePreference } = useAppPreferences();
  const isDark = resolvedTheme === 'dark';
  const nextTheme = isDark ? 'light' : 'dark';

  return (
    <Pressable
      accessibilityLabel={isDark ? 'Açık temaya geç' : 'Koyu temaya geç'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => void setThemePreference(nextTheme)}
      style={({ pressed }) => [
        styles.button,
        isDark ? styles.lightButton : styles.darkButton,
        pressed && styles.pressed,
      ]}
    >
      <View pointerEvents="none">
        <SymbolView
          name={
            isDark
              ? { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' }
              : { ios: 'moon.stars.fill', android: 'dark_mode', web: 'dark_mode' }
          }
          size={21}
          tintColor={isDark ? '#382B0E' : '#F4D36A'}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    width: 44,
  },
  darkButton: {
    backgroundColor: '#27231F',
    borderColor: '#4B433A',
  },
  lightButton: {
    backgroundColor: '#F4D36A',
    borderColor: '#D3A62C',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
