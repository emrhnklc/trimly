import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type HomeHeroCardProps = {
  onExplorePress: () => void;
};

export function HomeHeroCard({ onExplorePress }: HomeHeroCardProps) {
  return (
    <AppCard style={styles.card}>
      <Image
        contentFit="cover"
        source={require('../../../../assets/images/home/discover-barbershop.png')}
        style={styles.backgroundImage}
      />
      <View pointerEvents="none" style={styles.imageOverlay} />

      <AppText color="surfaceMuted" variant="overline">
        SİZE ÖZEL ÖNERİLER
      </AppText>
      <AppText color="surface" style={styles.title} variant="displayMedium">
        Tarzına en uygun berberi keşfet.
      </AppText>
      <View style={styles.buttonRow}>
        <Pressable
          accessibilityLabel="Berberleri keşfet"
          accessibilityRole="button"
          onPress={onExplorePress}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <AppText color="onPrimary" variant="label">Keşfet</AppText>
        </Pressable>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkSurface,
    borderColor: colors.darkSurface,
    marginTop: spacing.sm,
    minHeight: 146,
    overflow: 'hidden',
    padding: spacing.md,
  },
  backgroundImage: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  imageOverlay: {
    backgroundColor: 'rgba(18, 12, 8, 0.18)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  title: { fontSize: 22, lineHeight: 27, marginTop: spacing.xxs, maxWidth: 220 },
  buttonRow: { alignSelf: 'flex-start', marginTop: 'auto' },
  button: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: spacing.md,
  },
  buttonPressed: { opacity: 0.8 },
});
