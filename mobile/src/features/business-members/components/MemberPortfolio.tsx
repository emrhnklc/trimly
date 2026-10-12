import { useEffect, useState } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { FullscreenImageViewer } from "@/components/ui/FullscreenImageViewer";
import { getPublicPortfolio } from "@/features/portfolio/api";
import type { PublicPortfolioItem } from "@/features/portfolio/types";
import { resolveApiUrl } from "@/lib/api/client";
import { radius, spacing } from "@/theme/spacing";

export function MemberPortfolio({
  shopId,
  memberId,
  compact = false,
}: {
  shopId: string;
  memberId: string;
  compact?: boolean;
}) {
  const [items, setItems] = useState<PublicPortfolioItem[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    const requestId = setTimeout(() => {
      setItems([]);
      setLoading(true);
      setError(false);
      setViewer(null);
      void getPublicPortfolio(shopId)
        .then((result) => {
          if (active)
            setItems(
              result.filter((item) => item.businessMember.id === memberId),
            );
        })
        .catch(() => {
          if (active) setError(true);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(requestId);
    };
  }, [shopId, memberId, attempt]);
  const images = items.map((item) => ({
    id: item.id,
    label: item.title ?? "Tıraş örneği",
    source: { uri: resolveApiUrl(item.imageUrl) },
  }));
  return (
    <AppCard style={compact ? styles.compactSection : styles.section}>
      <View style={styles.heading}>
        <AppText variant="cardTitle">Tıraş Örnekleri</AppText>
        {images.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setViewer(0)}
            hitSlop={8}
          >
            <AppText color="primary" variant="bodySmall">
              Tümünü Gör ›
            </AppText>
          </Pressable>
        ) : null}
      </View>
      <AppText color="textMuted" variant="bodySmall">
        Yalnızca müşterinin yayın izni verdiği fotoğraflar gösterilir.
      </AppText>
      {error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAttempt((value) => value + 1)}
        >
          <AppText color="primary">
            Fotoğraflar yüklenemedi. Tekrar Dene
          </AppText>
        </Pressable>
      ) : !items.length ? (
        <AppText color="textMuted">
          {loading
            ? "Tıraş örnekleri yükleniyor…"
            : "Henüz yayınlanmış tıraş örneği yok."}
        </AppText>
      ) : null}
      <ScrollView
        horizontal={compact}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={compact ? styles.strip : styles.grid}
      >
        {images.map((item, index) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel="Tıraş fotoğrafını büyüt"
            onPress={() => setViewer(index)}
            style={compact ? styles.stripPhoto : styles.photo}
          >
            <Image
              source={item.source}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        ))}
      </ScrollView>
      {viewer !== null ? (
        <FullscreenImageViewer
          images={images}
          initialIndex={viewer}
          onClose={() => setViewer(null)}
          visible
        />
      ) : null}
    </AppCard>
  );
}
const styles = StyleSheet.create({
  section: { gap: spacing.sm, marginTop: spacing.lg },
  compactSection: { gap: spacing.sm },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  strip: { gap: spacing.sm },
  stripPhoto: {
    width: 132,
    height: 106,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  photo: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: radius.card,
    overflow: "hidden",
  },
});
