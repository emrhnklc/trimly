import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { SymbolView } from "expo-symbols";

import { AppIconButton } from "@/components/ui/AppIconButton";
import { AppText } from "@/components/ui/AppText";
import { BarbershopRating } from "@/features/barbershops/components/BarbershopRating";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type BarbershopHeroProps = {
  barbershop: PublicBarbershopDetail;
  isFavorite: boolean;
  isFavoriteLoading?: boolean;
  onFavoritePress: () => void;
};

export function BarbershopHero({
  barbershop,
  isFavorite,
  isFavoriteLoading = false,
  onFavoritePress,
}: BarbershopHeroProps) {
  const colors = useThemeColors();
  const initial = barbershop.name.slice(0, 1).toUpperCase();
  const isBookable = Boolean(barbershop.services.length && barbershop.members.length);

  return (
    <View style={styles.hero}>
      <View style={[styles.cover, { backgroundColor: colors.darkSurface }]}>
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
              name={{
                ios: "scissors",
                android: "content_cut",
                web: "content_cut",
              }}
              size={64}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={[styles.fill, styles.overlay]} />
      </View>

      <View
        style={[
          styles.summary,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.avatarFrame, { backgroundColor: colors.surface }]}>
          {barbershop.profileImageUrl ? (
            <Image
              accessibilityLabel={`${barbershop.name} profil fotoğrafı`}
              contentFit="cover"
              source={barbershop.profileImageUrl}
              style={styles.avatar}
              transition={180}
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.avatarPlaceholder,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <AppText
                color="primary"
                style={styles.initial}
                variant="displayLarge"
              >
                {initial}
              </AppText>
            </View>
          )}
        </View>

        <View style={styles.identity}>
          <AppText
            adjustsFontSizeToFit
            minimumFontScale={0.86}
            numberOfLines={2}
            style={styles.name}
            variant="displayMedium"
          >
            {barbershop.name}
          </AppText>
          <View style={styles.metaRow}>
            <View
              style={[
                styles.pill,
                { backgroundColor: isBookable ? colors.successSurface : colors.dangerSurface },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isBookable ? colors.success : colors.danger },
                ]}
              />
              <AppText
                color={isBookable ? "success" : "danger"}
                style={styles.pillText}
                variant="bodySmall"
              >
                {isBookable ? "Randevuya açık" : "Randevu kapalı"}
              </AppText>
            </View>
            <View
              style={[styles.pill, { backgroundColor: colors.surfaceMuted }]}
            >
              <BarbershopRating
                compact
                ratingAverage={barbershop.ratingAverage}
                ratingCount={barbershop.ratingCount}
              />
            </View>
          </View>
        </View>

        <View style={styles.favoriteButton}>
          <AppIconButton
            accessibilityLabel={
              isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"
            }
            color="primary"
            disabled={isFavoriteLoading}
            icon={{
              ios: isFavorite ? "heart.fill" : "heart",
              android: isFavorite ? "favorite" : "favorite_border",
              web: isFavorite ? "favorite" : "favorite_border",
            }}
            onPress={onFavoritePress}
            variant="transparent"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { marginBottom: spacing.md },
  cover: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: 218,
    overflow: "hidden",
  },
  fill: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.72,
  },
  overlay: { backgroundColor: "rgba(22, 16, 12, 0.23)" },
  summary: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: -18,
    minHeight: 108,
    paddingBottom: spacing.sm,
    paddingLeft: 108,
    paddingRight: 54,
    paddingTop: spacing.md,
  },
  avatarFrame: {
    borderRadius: radius.pill,
    height: 88,
    left: spacing.md,
    padding: 4,
    position: "absolute",
    top: -32,
    width: 88,
  },
  avatar: { borderRadius: radius.pill, height: "100%", width: "100%" },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 42, lineHeight: 48 },
  identity: { flex: 1 },
  favoriteButton: { position: "absolute", right: spacing.sm, top: spacing.sm },
  name: { fontSize: 28, lineHeight: 33 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginLeft: -92,
    marginRight: -42,
    marginTop: spacing.xs,
  },
  pill: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    minHeight: 24,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, lineHeight: 15 },
  statusDot: { borderRadius: radius.pill, height: 6, marginRight: 5, width: 6 },
});
