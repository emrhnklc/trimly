import { Image } from "expo-image";
import { useRouter } from "expo-router";
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
      <View style={styles.gallery}>
        {photos.slice(0, 2).map((photo) => (
          <Image
            contentFit="cover"
            key={photo.id}
            source={photo.url}
            style={[
              styles.tile,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
              },
            ]}
          />
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
  gallery: { flexDirection: "row", gap: spacing.xs },
  tile: {
    aspectRatio: 1.2,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
  },
  allPhotosButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.62 },
});
