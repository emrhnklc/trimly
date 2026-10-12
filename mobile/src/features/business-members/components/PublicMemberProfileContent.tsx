import { useState } from "react";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { businessRoleLabels } from "@/features/business/role-labels";
import type { PublicMemberProfile } from "../profile-api";
import { MemberPortfolio } from "./MemberPortfolio";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function PublicMemberProfileContent({
  profile,
  shop,
  bookable,
}: {
  profile: PublicMemberProfile;
  shop: { id: string; name: string };
  bookable: boolean;
}) {
  const colors = useThemeColors();
  const [allServices, setAllServices] = useState(false);
  const [allReviews, setAllReviews] = useState(false);
  return (
    <>
      <AppCard style={styles.section}>
        <View style={styles.identity}>
          {profile.user.profileImageUrl ? (
            <Image
              source={profile.user.profileImageUrl}
              style={[styles.avatar, { borderColor: colors.primary }]}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.avatar,
                styles.initial,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.primary,
                },
              ]}
            >
              <AppText color="primary" variant="heading">
                {profile.user.firstName[0]}
              </AppText>
            </View>
          )}
          <View style={styles.copy}>
            <AppText variant="heading">
              {profile.user.firstName} {profile.user.lastName}
            </AppText>
            <AppText color="textMuted" variant="bodySmall">
              {businessRoleLabels[profile.role]} · {shop.name}
            </AppText>
            <View
              style={[
                styles.status,
                {
                  backgroundColor: bookable
                    ? colors.successSurface
                    : colors.dangerSurface,
                },
              ]}
            >
              <AppText
                color={bookable ? "success" : "danger"}
                variant="bodySmall"
              >
                ● {bookable ? "Randevuya açık" : "Randevuya kapalı"}
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.profileStats}>
          <AppText color="primary" variant="label">
            ★ {profile.ratingAverage?.toFixed(1) ?? "—"}
          </AppText>
          <AppText variant="label" style={styles.statLabel}>
            {profile.ratingCount.toLocaleString("tr-TR")} değerlendirme
          </AppText>
          <AppText variant="label" style={styles.statLabel}>
            {profile.completedCount.toLocaleString("tr-TR")} tamamlanan randevu
          </AppText>
        </View>
        {profile.serviceAssignments.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ borderTopWidth: 1, borderTopColor: colors.border }}
            contentContainerStyle={styles.tags}
          >
            {profile.serviceAssignments.slice(0, 3).map(({ service }) => (
              <View
                key={service.id}
                style={[styles.tag, { borderColor: colors.border }]}
              >
                <SymbolView
                  name={{
                    ios: "scissors",
                    android: "content_cut",
                    web: "content_cut",
                  }}
                  size={14}
                  tintColor={colors.primary}
                />
                <AppText variant="bodySmall">{service.name}</AppText>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </AppCard>
      <AppCard style={styles.section}>
        <SectionHeading
          title="Hizmetler"
          action={
            profile.serviceAssignments.length > 3
              ? allServices
                ? "Daha Az"
                : "Tümünü Gör"
              : undefined
          }
          onPress={() => setAllServices((value) => !value)}
        />
        {profile.serviceAssignments.length ? (
          profile.serviceAssignments
            .slice(0, allServices ? undefined : 3)
            .map(({ service }) => (
              <View
                key={service.id}
                style={[styles.service, { borderColor: colors.border }]}
              >
                <View
                  style={[
                    styles.serviceIcon,
                    { backgroundColor: colors.surfaceMuted },
                  ]}
                >
                  <SymbolView
                    name={{
                      ios: "scissors",
                      android: "content_cut",
                      web: "content_cut",
                    }}
                    size={24}
                    tintColor={colors.primary}
                  />
                </View>
                <AppText variant="cardTitle" style={styles.copy}>
                  {service.name}
                </AppText>
              </View>
            ))
        ) : (
          <AppText color="textMuted">Henüz aktif hizmet yok.</AppText>
        )}
      </AppCard>
      <MemberPortfolio shopId={shop.id} memberId={profile.id} compact />
      <AppCard style={styles.section}>
        <SectionHeading
          title="Doğrulanmış Yorumlar"
          action={
            profile.reviews.length > 2
              ? allReviews
                ? "Daha Az"
                : "Son Yorumları Gör"
              : undefined
          }
          onPress={() => setAllReviews((value) => !value)}
        />
        {profile.reviews.length ? (
          profile.reviews.slice(0, allReviews ? undefined : 2).map((review) => (
            <View
              key={review.id}
              style={[styles.review, { borderColor: colors.border }]}
            >
              <View
                style={[
                  styles.reviewAvatar,
                  { backgroundColor: colors.surfaceMuted },
                ]}
              >
                <AppText color="primary" variant="label">
                  {review.customerName[0]}
                </AppText>
              </View>
              <View style={styles.copy}>
                <AppText variant="label">{review.customerName}</AppText>
                <View style={styles.stats}>
                  <AppText color="primary">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </AppText>
                  <AppText color="textMuted" variant="bodySmall">
                    {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                  </AppText>
                </View>
                {review.comment?.trim() ? (
                  <AppText color="textMuted" variant="bodySmall">
                    {review.comment.trim()}
                  </AppText>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <AppText color="textMuted">Henüz doğrulanmış yorum yok.</AppText>
        )}
      </AppCard>
    </>
  );
}
function SectionHeading({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.heading}>
      <AppText variant="cardTitle" style={styles.copy}>
        {title}
      </AppText>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}>
          <AppText color="primary" variant="bodySmall">
            {action} ›
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  copy: { flex: 1, minWidth: 0 },
  avatar: { width: 66, height: 66, borderRadius: radius.pill, borderWidth: 1 },
  initial: { alignItems: "center", justifyContent: "center" },
  status: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    alignItems: "center",
  },
  profileStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: spacing.sm,
    rowGap: spacing.xs,
  },
  statLabel: { fontSize: 13, lineHeight: 19 },
  service: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  serviceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  tags: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  tag: {
    flexDirection: "row",
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heading: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  review: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  reviewAvatar: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
});
