import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type {
  PublicBarberDetail,
  PublicBarbershopDetail,
} from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarberProfileHeroProps = {
  barber: PublicBarberDetail;
  shop: PublicBarbershopDetail;
};

export function BarberProfileHero({ barber, shop }: BarberProfileHeroProps) {
  const fullName = `${barber.user.firstName} ${barber.user.lastName}`;
  const initials = `${barber.user.firstName[0] ?? ''}${barber.user.lastName[0] ?? ''}`;

  return (
    <View>
      <View style={styles.cover}>
        {shop.profileImageUrl ? (
          <Image contentFit="cover" source={shop.profileImageUrl} style={styles.fill} transition={200} />
        ) : (
          <View style={[styles.fill, styles.coverPlaceholder]}>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={58}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={[styles.fill, styles.overlay]} />
      </View>

      <View style={styles.summary}>
        {barber.user.profileImageUrl ? (
          <Image
            accessibilityLabel={`${fullName} profil fotoğrafı`}
            contentFit="cover"
            source={barber.user.profileImageUrl}
            style={styles.avatar}
            transition={180}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <AppText color="primary" style={styles.initials} variant="displayMedium">{initials}</AppText>
          </View>
        )}

        <View style={styles.identity}>
          <AppText style={styles.name} variant="displayMedium">{fullName}</AppText>
          <AppText color="textMuted" style={styles.shopName} variant="bodySmall">
            {shop.name} ekibinde
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: 210,
    overflow: 'hidden',
  },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', opacity: 0.55 },
  overlay: { backgroundColor: 'rgba(25, 18, 13, 0.34)' },
  summary: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 108,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  avatar: {
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 4,
    height: 92,
    marginTop: -48,
    width: 92,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  initials: { fontSize: 25, lineHeight: 31 },
  identity: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: 24, lineHeight: 30 },
  shopName: { marginTop: spacing.xxs },
});
