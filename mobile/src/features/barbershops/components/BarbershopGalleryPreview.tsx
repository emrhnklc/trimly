import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { BarbershopEmptyState } from "@/features/barbershops/components/BarbershopEmptyState";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function BarbershopGalleryPreview({
  photos,
  slug,
}: {
  photos: { id: string; url: string }[];
  slug: string;
}) {
  const router = useRouter();
  const colors = useThemeColors();
  const [galleryWidth, setGalleryWidth] = useState(0);
  const tileWidth = Math.max(0, (galleryWidth - spacing.xs) / 2);

  if (!photos.length) {
    return (
      <BarbershopEmptyState
        description="İşletme galerisini güncellediğinde fotoğraflar burada görünecek."
        icon={{
          ios: "photo.on.rectangle",
          android: "photo_library",
          web: "photo_library",
        }}
        title="Henüz mekân fotoğrafı yok"
      />
    );
  }
  return (
    <View>
      <View style={styles.heading}>
        <AppText color="textMuted" variant="bodySmall">
          {photos.length} fotoğraf
        </AppText>
        <Pressable
          accessibilityLabel="Galerinin tümünü gör"
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: "/barbers/[slug]/gallery",
              params: { slug },
            })
          }
          style={({ pressed }) => [
            styles.allPhotosButton,
            pressed && styles.pressed,
          ]}
        >
          <AppText color="primary" variant="label">
            Tümünü Gör
          </AppText>
        </Pressable>
      </View>
      <View
        onLayout={({ nativeEvent }) => setGalleryWidth(nativeEvent.layout.width)}
        style={styles.gallery}
      >
        {photos.slice(0, 4).map((photo) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Galeri fotoğrafını aç"
            key={photo.id}
            onPress={() => router.push({ pathname: "/barbers/[slug]/gallery", params: { slug } })}
            style={[
              styles.tile,
              {
                width: tileWidth,
                height: tileWidth / 1.2,
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <Image
              contentFit="cover"
              source={photo.url}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  gallery: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  tile: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  allPhotosButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.62 },
});
