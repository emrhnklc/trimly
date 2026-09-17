import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { AppText } from "@/components/ui/AppText";
import { BarbershopEmptyState } from "@/features/barbershops/components/BarbershopEmptyState";
import { FullscreenImageViewer } from "@/components/ui/FullscreenImageViewer";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  addFavoritePortfolioItem,
  getFavoriteStyles,
  removeFavoritePortfolioItem,
} from "@/features/favorites/api";
import { getPublicPortfolio } from "@/features/portfolio/api";
import type { PublicPortfolioItem } from "@/features/portfolio/types";
import { resolveApiUrl } from "@/lib/api/client";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { BarbershopGalleryPreview } from "./BarbershopGalleryPreview";

type ShowcaseTab = "venue" | "portfolio";

export function BarbershopWorkShowcase({
  barbershopId,
  galleryPhotos,
  slug,
}: {
  barbershopId: string;
  galleryPhotos: { id: string; url: string }[];
  slug: string;
}) {
  const colors = useThemeColors();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("portfolio");
  const [portfolio, setPortfolio] = useState<PublicPortfolioItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getPublicPortfolio(barbershopId),
      token ? getFavoriteStyles(token) : Promise.resolve([]),
    ])
      .then(([items, favorites]) => {
        if (!active) return;
        setPortfolio(items);
        if (!items.length) setActiveTab("venue");
        setFavoriteIds(
          favorites
            .filter((favorite) => favorite.kind === "PORTFOLIO")
            .map((favorite) => favorite.sourceId),
        );
      })
      .catch(() => {
        if (active) setActiveTab("venue");
      });
    return () => {
      active = false;
    };
  }, [barbershopId, token]);

  const members = useMemo(() => {
    const unique = new Map<string, PublicPortfolioItem["businessMember"]>();
    portfolio.forEach((item) =>
      unique.set(item.businessMember.id, item.businessMember),
    );
    return [...unique.values()];
  }, [portfolio]);
  const visibleItems = memberId
    ? portfolio.filter((item) => item.businessMember.id === memberId)
    : portfolio;
  const fullscreenImages = visibleItems.map((item) => ({
    id: item.id,
    label: item.title ?? "Tıraş portföyü fotoğrafı",
    source: { uri: resolveApiUrl(item.imageUrl) },
  }));

  async function toggleFavorite(itemId: string) {
    if (!token) return;
    const wasFavorite = favoriteIds.includes(itemId);
    setFavoriteIds((current) =>
      wasFavorite
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );
    try {
      if (wasFavorite) await removeFavoritePortfolioItem(itemId, token);
      else await addFavoritePortfolioItem(itemId, token);
    } catch {
      setFavoriteIds((current) =>
        wasFavorite
          ? [...current, itemId]
          : current.filter((id) => id !== itemId),
      );
    }
  }

  return (
    <View>
      <View style={[styles.tabs, { backgroundColor: colors.surfaceMuted }]}>
        <ShowcaseTabButton
          active={activeTab === "venue"}
          label="Mekân"
          onPress={() => setActiveTab("venue")}
        />
        <ShowcaseTabButton
          active={activeTab === "portfolio"}
          label="Tıraşlar"
          onPress={() => setActiveTab("portfolio")}
        />
      </View>

      {activeTab === "venue" ? (
        <BarbershopGalleryPreview photos={galleryPhotos} slug={slug} />
      ) : portfolio.length ? (
        <View>
          {members.length > 1 ? (
            <ScrollView
              contentContainerStyle={styles.filters}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <FilterChip
                active={!memberId}
                label="Tümü"
                onPress={() => setMemberId(null)}
              />
              {members.map((member) => (
                <FilterChip
                  active={memberId === member.id}
                  key={member.id}
                  label={member.user.firstName}
                  onPress={() => setMemberId(member.id)}
                />
              ))}
            </ScrollView>
          ) : null}
          <View style={styles.grid}>
            {visibleItems.map((item, index) => {
              const barberName = `${item.businessMember.user.firstName} ${item.businessMember.user.lastName}`;
              const isFavorite = favoriteIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setViewerIndex(index)}
                  style={({ pressed }) => [
                    styles.card,
                    pressed && styles.pressed,
                  ]}
                >
                  <Image
                    contentFit="cover"
                    source={resolveApiUrl(item.imageUrl)}
                    style={styles.image}
                  />
                  <Pressable
                    accessibilityLabel={
                      isFavorite
                        ? "Stili kaydedilenlerden çıkar"
                        : "Stili kaydet"
                    }
                    onPress={(event) => {
                      event.stopPropagation();
                      void toggleFavorite(item.id);
                    }}
                    style={styles.favoriteButton}
                  >
                    <SymbolView
                      name={{
                        ios: isFavorite ? "heart.fill" : "heart",
                        android: isFavorite ? "favorite" : "favorite_border",
                        web: isFavorite ? "favorite" : "favorite_border",
                      }}
                      size={20}
                      tintColor={isFavorite ? colors.primary : "#FFFFFF"}
                    />
                  </Pressable>
                  <AppText
                    numberOfLines={1}
                    style={styles.itemTitle}
                    variant="label"
                  >
                    {item.title ?? "Tıraş stili"}
                  </AppText>
                  <AppText
                    color="textMuted"
                    numberOfLines={1}
                    variant="bodySmall"
                  >
                    {barberName}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : (
        <BarbershopEmptyState
          description="Ekibin yayınladığı çalışmalar burada sergilenecek."
          icon={{ ios: "scissors", android: "content_cut", web: "content_cut" }}
          title="Henüz yayınlanmış tıraş yok"
        />
      )}

      <FullscreenImageViewer
        images={fullscreenImages}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        visible={viewerIndex !== null}
      />
    </View>
  );
}

function ShowcaseTabButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && { backgroundColor: colors.darkSurface }]}
    >
      <AppText color={active ? "onPrimary" : "textMuted"} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        { backgroundColor: colors.surfaceMuted },
        active && { backgroundColor: colors.darkSurface },
      ]}
    >
      <AppText color={active ? "onPrimary" : "textMuted"} variant="bodySmall">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderRadius: radius.pill,
    flexDirection: "row",
    marginBottom: spacing.sm,
    padding: 3,
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    justifyContent: "center",
    minHeight: 36,
  },
  filters: { gap: spacing.xs, marginBottom: spacing.sm },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: { width: "48.5%" },
  image: { aspectRatio: 0.92, borderRadius: radius.md, width: "100%" },
  favoriteButton: {
    alignItems: "center",
    backgroundColor: "#1C1712CC",
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    position: "absolute",
    right: spacing.xs,
    top: spacing.xs,
    width: 38,
  },
  itemTitle: { marginTop: spacing.xs },
  pressed: { opacity: 0.72 },
});
