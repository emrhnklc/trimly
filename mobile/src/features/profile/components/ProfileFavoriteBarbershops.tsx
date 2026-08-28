import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { BarbershopRating } from '@/features/barbershops/components/BarbershopRating';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ProfileFavoriteBarbershops({
  favorites,
  onBarbershopPress,
  onViewAllPress,
}: {
  favorites: FavoriteBarbershop[];
  onBarbershopPress: (slug: string) => void;
  onViewAllPress: () => void;
}) {
  return (
    <View>
      <SectionHeader
        actionLabel="Tümünü gör"
        onActionPress={onViewAllPress}
        title="Favori Berberlerim"
      />
      {favorites.length ? (
        <ScrollView
          contentContainerStyle={styles.list}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {favorites.slice(0, 8).map(({ barbershop }) => (
            <Pressable
              accessibilityLabel={`${barbershop.name} işletmesini aç`}
              accessibilityRole="button"
              key={barbershop.id}
              onPress={() => onBarbershopPress(barbershop.slug)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              {barbershop.profileImageUrl ? (
                <Image
                  accessibilityLabel={`${barbershop.name} profil fotoğrafı`}
                  contentFit="cover"
                  source={barbershop.profileImageUrl}
                  style={styles.avatar}
                  transition={180}
                />
              ) : (
                <View style={[styles.avatar, styles.placeholder]}>
                  <AppText color="primary" variant="displayMedium">
                    {barbershop.name.slice(0, 1).toUpperCase()}
                  </AppText>
                </View>
              )}
              <AppText numberOfLines={1} style={styles.name} variant="bodySmall">
                {barbershop.name}
              </AppText>
              <BarbershopRating
                compact
                ratingAverage={barbershop.ratingAverage}
                ratingCount={barbershop.ratingCount}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Pressable
          accessibilityLabel="Favori berberlerini keşfet"
          accessibilityRole="button"
          onPress={onViewAllPress}
          style={({ pressed }) => [styles.emptyState, pressed && styles.pressed]}>
          <AppText variant="label">Henüz favori işletmen yok</AppText>
          <AppText color="textMuted" style={styles.emptyDescription} variant="bodySmall">
            Beğendiğin işletmeleri kaydedip buradan hızlıca ulaşabilirsin.
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingRight: spacing.lg },
  item: { alignItems: 'center', width: 94 },
  pressed: { opacity: 0.7 },
  avatar: { borderRadius: radius.pill, height: 72, width: 72 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  name: { marginTop: spacing.xs, textAlign: 'center', width: '100%' },
  emptyState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  emptyDescription: { marginTop: spacing.xxs },
});
