import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarbershopHeroProps = {
  barbershop: PublicBarbershopDetail;
};

export function BarbershopHero({ barbershop }: BarbershopHeroProps) {
  const initial = barbershop.name.slice(0, 1).toUpperCase();

  return (
    <View style={styles.hero}>
      {barbershop.profileImageUrl ? (
        <Image
          accessibilityLabel={`${barbershop.name} işletme görseli`}
          contentFit="cover"
          source={barbershop.profileImageUrl}
          style={styles.fill}
          transition={200}
        />
      ) : (
        <View style={[styles.fill, styles.placeholder]}>
          <AppText color="surfaceMuted" style={styles.initial} variant="displayLarge">
            {initial}
          </AppText>
        </View>
      )}
      <View style={[styles.fill, styles.overlay]} />
      <View style={styles.content}>
        <AppText color="onPrimary" style={styles.name} variant="displayMedium">
          {barbershop.name}
        </AppText>
        {barbershop.address ? (
          <AppText color="surfaceMuted" style={styles.address} variant="bodySmall">
            {barbershop.address}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    height: 238,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 92, lineHeight: 104, opacity: 0.22 },
  overlay: {
    backgroundColor: 'rgba(25, 18, 13, 0.38)',
  },
  content: { padding: spacing.lg },
  name: { textShadowColor: 'rgba(0, 0, 0, 0.35)', textShadowRadius: 8 },
  address: { marginTop: spacing.xs },
});
