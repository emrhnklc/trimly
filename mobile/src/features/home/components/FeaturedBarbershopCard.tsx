import { Image } from 'expo-image';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { BarbershopRating } from '@/features/barbershops/components/BarbershopRating';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function FeaturedBarbershopCard({
  barbershop,
  isFavorite,
  onFavoritePress,
  onPress,
}: {
  barbershop: PublicBarbershop;
  isFavorite: boolean;
  onFavoritePress: () => void;
  onPress: () => void;
}) {
  const imageUrl = barbershop.coverImageUrl ?? barbershop.profileImageUrl;

  return (
    <Pressable
      accessibilityLabel={`${barbershop.name} işletmesini aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageArea}>
        {imageUrl ? (
          <Image
            accessibilityLabel={`${barbershop.name} görseli`}
            contentFit="cover"
            source={imageUrl}
            style={styles.image}
            transition={180}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={38}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={styles.imageShade} />
        <Pressable
          accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          accessibilityRole="button"
          hitSlop={6}
          onPress={(event: GestureResponderEvent) => {
            event.stopPropagation();
            onFavoritePress();
          }}
          style={({ pressed }) => [styles.bookmark, pressed && styles.bookmarkPressed]}>
          <SymbolView
            name={{
              ios: isFavorite ? 'bookmark.fill' : 'bookmark',
              android: isFavorite ? 'bookmark' : 'bookmark_border',
              web: isFavorite ? 'bookmark' : 'bookmark_border',
            }}
            size={17}
            tintColor={colors.primary}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <AppText numberOfLines={1} variant="label">{barbershop.name}</AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.address} variant="bodySmall">
          {barbershop.address ?? 'Konum bilgisi yakında'}
        </AppText>
        <View style={styles.rating}>
          <BarbershopRating
            compact
            ratingAverage={barbershop.ratingAverage}
            ratingCount={barbershop.ratingCount}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    width: 236,
  },
  pressed: { opacity: 0.74 },
  imageArea: { height: 132, overflow: 'hidden' },
  image: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    justifyContent: 'center',
  },
  imageShade: {
    backgroundColor: 'rgba(22, 16, 12, 0.12)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  bookmark: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 34,
  },
  bookmarkPressed: { opacity: 0.64 },
  content: { padding: spacing.sm },
  address: { marginTop: spacing.xxs },
  rating: { marginTop: spacing.xs },
});
