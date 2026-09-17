import { Image } from 'expo-image';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { radius, spacing } from '@/theme/spacing';

type TrimlyLogoProps = ViewProps & {
  size?: 'small' | 'large';
};

export function TrimlyLogo({ size = 'large', style, ...props }: TrimlyLogoProps) {
  const isLarge = size === 'large';
  const { resolvedTheme } = useAppPreferences();

  return (
    <View
      accessibilityLabel="Trimly"
      accessibilityRole="image"
      style={[styles.container, resolvedTheme === 'dark' && styles.darkContainer, style]}
      {...props}>
      <Image
        contentFit="contain"
        source={require('../../../assets/branding/trimly-wordmark.png')}
        style={isLarge ? styles.imageLarge : styles.imageSmall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
  darkContainer: {
    backgroundColor: '#F7F3EA',
    borderRadius: radius.md,
    paddingHorizontal: spacing.xs,
  },
  imageLarge: { height: 62, width: 186 },
  imageSmall: { height: 38, width: 114 },
});
