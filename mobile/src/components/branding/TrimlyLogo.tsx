import { Image } from 'expo-image';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';

type TrimlyLogoProps = ViewProps & {
  size?: 'small' | 'large';
};

export function TrimlyLogo({ size = 'large', style, ...props }: TrimlyLogoProps) {
  const isLarge = size === 'large';
  const { resolvedTheme } = useAppPreferences();
  const isDark = resolvedTheme === 'dark';

  return (
    <View
      accessibilityLabel="Trimly"
      accessibilityRole="image"
      style={[
        styles.container,
        isLarge ? styles.containerLarge : styles.containerSmall,
        style,
      ]}
      {...props}>
      <Image
        contentFit="contain"
        source={
          isDark
            ? require('../../../assets/branding/trimly-wordmark-dark.png')
            : require('../../../assets/branding/trimly-wordmark.png')
        }
        style={isLarge ? styles.imageLarge : styles.imageSmall}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center' },
  containerLarge: { height: 62, width: 186 },
  containerSmall: { height: 38, width: 114 },
  imageLarge: { height: 62, width: 186 },
  imageSmall: { height: 38, width: 114 },
});
