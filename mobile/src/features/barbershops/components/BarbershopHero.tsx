import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { SymbolView } from "expo-symbols";

import { AppText } from "@/components/ui/AppText";
import { BarbershopRating } from "@/features/barbershops/components/BarbershopRating";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type BarbershopHeroProps = {
  barbershop: PublicBarbershopDetail;
};

export function BarbershopHero({ barbershop }: BarbershopHeroProps) {
  const colors = useThemeColors();
  const initial = barbershop.name.slice(0, 1).toUpperCase();
  const isBookable = Boolean(
    barbershop.isBookingOpen &&
    barbershop.services.length &&
    barbershop.members.length,
  );

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
        <View
          style={[
            styles.avatarFrame,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
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
                {
                  backgroundColor: isBookable
                    ? colors.successSurface
                    : colors.dangerSurface,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isBookable
                      ? colors.success
                      : colors.danger,
                  },
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
        <View style={[styles.summaryStats, { borderTopColor: colors.border }]}>
          {(
            [
              {
                value: barbershop.completedCount,
                label: "Tamamlanan randevu",
                icon: { ios: "calendar", android: "event", web: "event" },
              },
              {
                value: barbershop.services.length,
                label: "Hizmet",
                icon: {
                  ios: "scissors",
                  android: "content_cut",
                  web: "content_cut",
                },
              },
              {
                value: barbershop.members.length,
                label: "Berber",
                icon: { ios: "person.2", android: "group", web: "group" },
              },
            ] as const
          ).map(({ value, label, icon }, index) => (
            <View
              key={label}
              style={[
                styles.summaryStat,
                index > 0 && {
                  borderLeftWidth: 1,
                  borderLeftColor: colors.border,
                },
              ]}
            >
              <View style={styles.statHeader}>
                <SymbolView name={icon} size={19} tintColor={colors.primary} />
                <AppText variant="label">
                  {value === undefined ? "—" : value.toLocaleString("tr-TR")}
                </AppText>
              </View>
              <AppText
                color="textMuted"
                variant="bodySmall"
                style={styles.statLabel}
              >
                {label}
              </AppText>
            </View>
          ))}
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
    height: 284,
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
    minHeight: 144,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    paddingTop: spacing.md,
  },
  avatarFrame: {
    borderRadius: radius.pill,
    height: 96,
    left: spacing.md,
    padding: 3,
    borderWidth: 1,
    position: "absolute",
    top: -32,
    width: 96,
  },
  avatar: { borderRadius: radius.pill, height: "100%", width: "100%" },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 42, lineHeight: 48 },
  identity: { marginLeft: 108, minHeight: 72 },
  name: { fontSize: 28, lineHeight: 33 },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.md,
    marginLeft: -108,
  },
  pill: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 4,
    minHeight: 24,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  pillText: { fontSize: 11, lineHeight: 15 },
  statusDot: { borderRadius: radius.pill, height: 6, marginRight: 5, width: 6 },
  summaryStats: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryStat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 5,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  statLabel: { fontSize: 12, lineHeight: 16, textAlign: "center" },
});
