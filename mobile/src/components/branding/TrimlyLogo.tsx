import { Image } from 'expo-image';
import { StyleSheet, View, type ViewProps } from 'react-native';

type TrimlyLogoProps = ViewProps & {
  size?: 'small' | 'large';
};

export function TrimlyLogo({ size = 'large', style, ...props }: TrimlyLogoProps) {
  const isLarge = size === 'large';

  return (
    <View
      accessibilityLabel="Trimly"
      accessibilityRole="image"
      style={[styles.container, style]}
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
  imageLarge: { height: 62, width: 186 },
  imageSmall: { height: 38, width: 114 },
});
