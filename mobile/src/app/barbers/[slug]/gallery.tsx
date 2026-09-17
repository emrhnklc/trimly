import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { FullscreenImageViewer } from "@/components/ui/FullscreenImageViewer";
import { getPublicBarbershop } from "@/features/barbershops/api";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import { BusinessDetailHeader } from "@/features/business/components/BusinessDetailHeader";
import { resolveApiUrl } from "@/lib/api/client";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

export default function BarbershopGalleryScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [barbershop, setBarbershop] = useState<PublicBarbershopDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const loadGallery = useCallback(async () => {
    if (!slug) {
      setError("İşletme galeri bağlantısı geçersiz.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setBarbershop(await getPublicBarbershop(slug));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Galeri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void loadGallery();
    }, [loadGallery]),
  );

  function goBack() {
    if (router.canGoBack()) router.back();
    else if (slug) {
      router.replace({ pathname: '/barbers/[slug]', params: { slug } });
    } else router.replace('/barbers');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader onBack={goBack} title="Mekân Galerisi" />
        {barbershop ? (
          <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
            {barbershop.name}
          </AppText>
        ) : null}

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? (
          <View style={styles.state}>
            <AppText color="danger" style={styles.stateText}>{error}</AppText>
            <AppButton onPress={() => void loadGallery()} variant="secondary">Tekrar Dene</AppButton>
          </View>
        ) : null}
        {!isLoading && !error && barbershop && !barbershop.galleryPhotos.length ? (
          <AppText color="textMuted" style={styles.stateText}>
            İşletme henüz galeri fotoğrafı eklememiş.
          </AppText>
        ) : null}
        {!isLoading && !error && barbershop?.galleryPhotos.length ? (
          <View style={styles.grid}>
            {barbershop.galleryPhotos.map((photo, index) => (
              <Pressable
                accessibilityLabel="Galeri fotoğrafı"
                key={photo.id}
                onPress={() => setSelectedPhotoIndex(index)}
                style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
              >
                <Image contentFit="cover" source={photo.url} style={styles.image} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
      <FullscreenImageViewer
        images={(barbershop?.galleryPhotos ?? []).map((photo, index) => ({
          id: photo.id,
          label: `${barbershop?.name ?? "İşletme"} stil fotoğrafı ${index + 1}`,
          source: { uri: resolveApiUrl(photo.url) },
        }))}
        initialIndex={selectedPhotoIndex ?? 0}
        onClose={() => setSelectedPhotoIndex(null)}
        visible={selectedPhotoIndex !== null}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 48, paddingHorizontal: spacing.lg },
  subtitle: { marginTop: spacing.xs, textAlign: "center" },
  loader: { marginTop: spacing.xxxl },
  state: { gap: spacing.md, marginTop: spacing.xxxl },
  stateText: { marginTop: spacing.xxxl, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xl },
  tile: {
    aspectRatio: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    overflow: "hidden",
    width: "48.5%",
  },
  image: { height: "100%", width: "100%" },
  pressed: { opacity: 0.72 },
});
