import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
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
      <View pointerEvents="none" style={styles.accentCircle} />
      <View pointerEvents="none" style={styles.accentLine} />

      <AppText color="surfaceMuted" variant="overline">
        YENİ RANDEVU
      </AppText>
      <AppText color="surface" style={styles.title} variant="displayMedium">
        Bir sonraki tarzın birkaç dokunuş uzakta.
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
    marginTop: spacing.xl,
    minHeight: 218,
    overflow: 'hidden',
    padding: spacing.lg,
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
