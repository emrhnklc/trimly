import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

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
      <View style={styles.cover}>
        {barbershop.coverImageUrl ? (
          <Image
            accessibilityLabel={`${barbershop.name} kapak fotoğrafı`}
            contentFit="cover"
            source={barbershop.coverImageUrl}
            style={styles.fill}
            transition={200}
          />
        ) : (
          <View style={[styles.fill, styles.coverPlaceholder]}>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={64}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={[styles.fill, styles.overlay]} />
      </View>

      <View style={styles.summary}>
        <View style={styles.avatarFrame}>
          {barbershop.profileImageUrl ? (
            <Image
              accessibilityLabel={`${barbershop.name} profil fotoğrafı`}
              contentFit="cover"
              source={barbershop.profileImageUrl}
              style={styles.avatar}
              transition={180}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText color="primary" style={styles.initial} variant="displayLarge">
                {initial}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.identity}>
          <AppText numberOfLines={2} style={styles.name} variant="displayMedium">
            {barbershop.name}
          </AppText>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <AppText color="textMuted" variant="bodySmall">Randevuya açık işletme</AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md },
  cover: {
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: 250,
    overflow: 'hidden',
  },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', opacity: 0.72 },
  overlay: { backgroundColor: 'rgba(22, 16, 12, 0.23)' },
  summary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: -18,
    minHeight: 118,
    paddingBottom: spacing.md,
    paddingLeft: 124,
    paddingRight: spacing.md,
    paddingTop: spacing.md,
  },
  avatarFrame: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 104,
    left: spacing.md,
    padding: 4,
    position: 'absolute',
    top: -42,
    width: 104,
  },
  avatar: { borderRadius: radius.pill, height: '100%', width: '100%' },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  initial: { fontSize: 42, lineHeight: 48 },
  identity: { flex: 1 },
  name: { fontSize: 24, lineHeight: 29 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: spacing.xs },
  statusDot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 7, width: 7 },
});
