import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';

type TrimlyLogoProps = ViewProps & {
  size?: 'small' | 'large';
};

export function TrimlyLogo({ size = 'large', style, ...props }: TrimlyLogoProps) {
  const isLarge = size === 'large';

  return (
    <View
      accessibilityLabel="Trimly"
      accessibilityRole="header"
      style={[styles.container, style]}
      {...props}>
      <AppText style={[styles.wordmark, isLarge ? styles.wordmarkLarge : styles.wordmarkSmall]}>
        Trimly
      </AppText>
      <SymbolView
        name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
        size={isLarge ? 16 : 12}
        style={[styles.scissors, isLarge ? styles.scissorsLarge : styles.scissorsSmall]}
        tintColor={colors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', position: 'relative' },
  wordmark: { fontFamily: 'PlayfairDisplay_500Medium', lineHeight: undefined },
  wordmarkLarge: { fontSize: 42 },
  wordmarkSmall: { fontSize: 28 },
  scissors: { position: 'absolute', transform: [{ rotate: '-18deg' }] },
  scissorsLarge: { bottom: 3, right: -12 },
  scissorsSmall: { bottom: 2, right: -9 },
});
