import { useCallback, useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { FullscreenImageViewer } from "@/components/ui/FullscreenImageViewer";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { BarbershopEmptyState } from "@/features/barbershops/components/BarbershopEmptyState";
import { getBarbershopReviews } from "@/features/reviews/api";
import type { PublicAppointmentReview } from "@/features/reviews/types";
import { resolveApiUrl } from "@/lib/api/client";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function BarbershopReviewsSection({
  barbershopId,
}: {
  barbershopId: string;
}) {
  const colors = useThemeColors();
  const [reviews, setReviews] = useState<PublicAppointmentReview[]>([]);
  const [ratingAverage, setRatingAverage] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBarbershopReviews(barbershopId);
      setReviews(result.reviews);
      setRatingAverage(result.ratingAverage);
      setRatingCount(result.ratingCount);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Yorumlar yüklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [barbershopId]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadReviews(), 0);
    return () => clearTimeout(requestId);
  }, [loadReviews]);

  const fullscreenImages = useMemo(
    () =>
      reviews.flatMap((review) =>
        review.photos.map((photo, index) => ({
          id: photo.id,
          label: `${review.customer.displayName} yorum fotoğrafı ${index + 1}`,
          source: { uri: resolveApiUrl(photo.url) },
        })),
      ),
    [reviews],
  );
  const selectedImageIndex = fullscreenImages.findIndex(
    ({ id }) => id === selectedImageId,
  );

  if (isLoading) return <ActivityIndicator color={colors.primary} />;
  if (error) {
    return (
      <Pressable onPress={() => void loadReviews()}>
        <AppText color="danger" variant="bodySmall">
          {error} Tekrar denemek için dokun.
        </AppText>
      </Pressable>
    );
  }
  if (!reviews.length) {
    return (
      <BarbershopEmptyState
        description="İlk doğrulanmış randevu yorumu burada görünecek."
        icon={{ ios: "star", android: "star_border", web: "star_border" }}
        title="Henüz yorum yok"
      />
    );
  }

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <View>
      <AppCard style={styles.summaryCard}>
        <SymbolView
          name={{ ios: "star.fill", android: "star", web: "star" }}
          size={25}
          tintColor={colors.primary}
        />
        <AppText style={styles.average} variant="displayMedium">
          {ratingAverage?.toFixed(1)}
        </AppText>
        <AppText color="textMuted">
          {ratingCount} doğrulanmış değerlendirme
        </AppText>
      </AppCard>

      <View style={styles.reviewList}>
        {visibleReviews.map((review) => (
          <ReviewCard
            key={review.id}
            onPhotoPress={setSelectedImageId}
            review={review}
          />
        ))}
      </View>

      {reviews.length > 3 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setShowAll((current) => !current)}
          style={({ pressed }) => [
            styles.showAllButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText color="primary" variant="label">
            {showAll
              ? "Daha Az Göster"
              : `Tüm Yorumları Gör (${reviews.length})`}
          </AppText>
        </Pressable>
      ) : null}

      <FullscreenImageViewer
        images={fullscreenImages}
        initialIndex={Math.max(0, selectedImageIndex)}
        onClose={() => setSelectedImageId(null)}
        visible={selectedImageIndex >= 0}
      />
    </View>
  );
}

function ReviewCard({
  onPhotoPress,
  review,
}: {
  onPhotoPress: (photoId: string) => void;
  review: PublicAppointmentReview;
}) {
  const colors = useThemeColors();
  const barberName = `${review.businessMember.user.firstName} ${review.businessMember.user.lastName}`;
  return (
    <AppCard>
      <View style={styles.reviewHeader}>
        {review.customer.profileImageUrl ? (
          <Image
            source={review.customer.profileImageUrl}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <AppText color="primary" variant="label">
              {review.customer.displayName
                .slice(0, 1)
                .toLocaleUpperCase("tr-TR")}
            </AppText>
          </View>
        )}
        <View style={styles.identity}>
          <AppText variant="label">{review.customer.displayName}</AppText>
          <AppText color="textMuted" variant="bodySmall">
            {formatReviewDate(review.updatedAt)} · {barberName}
          </AppText>
        </View>
        <View
          style={[styles.ratingBadge, { backgroundColor: colors.surfaceMuted }]}
        >
          <SymbolView
            name={{ ios: "star.fill", android: "star", web: "star" }}
            size={14}
            tintColor={colors.primary}
          />
          <AppText color="primary" variant="label">
            {review.rating}
          </AppText>
        </View>
      </View>

      {review.comment ? (
        <AppText style={styles.comment}>{review.comment}</AppText>
      ) : null}
      {review.photos.length ? (
        <ScrollView
          contentContainerStyle={styles.photos}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {review.photos.map((photo, index) => (
            <Pressable
              accessibilityLabel={`Yorum fotoğrafı ${index + 1}`}
              accessibilityRole="button"
              key={photo.id}
              onPress={() => onPhotoPress(photo.id)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Image
                contentFit="cover"
                source={{ uri: resolveApiUrl(photo.url) }}
                style={styles.photo}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </AppCard>
  );
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  summaryCard: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
    minHeight: 68,
  },
  average: { fontSize: 25, lineHeight: 30 },
  reviewList: { gap: spacing.sm },
  reviewHeader: { alignItems: "center", flexDirection: "row" },
  avatar: { borderRadius: radius.pill, height: 42, width: 42 },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  identity: { flex: 1, marginLeft: spacing.sm },
  ratingBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  comment: { lineHeight: 22, marginTop: spacing.sm },
  photos: { gap: spacing.xs, paddingTop: spacing.sm },
  photo: { borderRadius: radius.md, height: 112, width: 112 },
  showAllButton: { alignItems: "center", paddingVertical: spacing.md },
  pressed: { opacity: 0.72 },
});
