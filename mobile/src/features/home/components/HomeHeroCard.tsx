import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type HomeHeroCardProps = {
  imageUrl?: string | null;
  onExplorePress: () => void;
};

export function HomeHeroCard({ imageUrl, onExplorePress }: HomeHeroCardProps) {
  return (
    <AppCard style={styles.card}>
      {imageUrl ? (
        <Image contentFit="cover" source={imageUrl} style={styles.backgroundImage} transition={200} />
      ) : null}
      <View pointerEvents="none" style={styles.imageOverlay} />
      <View pointerEvents="none" style={styles.accentCircle} />
      <View pointerEvents="none" style={styles.accentLine} />

      <AppText color="surfaceMuted" variant="overline">
        SİZE ÖZEL ÖNERİLER
      </AppText>
      <AppText color="surface" style={styles.title} variant="displayMedium">
        Tarzına en uygun berberi keşfet.
      </AppText>
      <View style={styles.buttonRow}>
        <AppButton onPress={onExplorePress} variant="secondary">
          Berberleri Gör
        </AppButton>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkSurface,
    marginTop: spacing.sm,
    minHeight: 164,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  backgroundImage: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  imageOverlay: {
    backgroundColor: 'rgba(24, 17, 13, 0.68)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: { marginTop: spacing.xs, maxWidth: 265 },
  buttonRow: { marginTop: 'auto', alignSelf: 'flex-start' },
  accentCircle: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 188,
    opacity: 0.22,
    position: 'absolute',
    right: -76,
    top: -54,
    width: 188,
  },
  accentLine: {
    backgroundColor: colors.surfaceMuted,
    bottom: 31,
    height: 1,
    opacity: 0.36,
    position: 'absolute',
    right: 20,
    width: 82,
  },
});
