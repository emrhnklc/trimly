import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function BusinessProfilePreview({
  address,
  coverImageUrl,
  isDiscoverable,
  name,
  onPressCoverImage,
  onPressProfileImage,
  profileImageUrl,
}: {
  address: string;
  coverImageUrl: string;
  isDiscoverable: boolean;
  name: string;
  onPressCoverImage?: () => void;
  onPressProfileImage?: () => void;
  profileImageUrl: string;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel="Kapak fotoğrafını değiştir"
        disabled={!onPressCoverImage}
        onPress={onPressCoverImage}
        style={({ pressed }) => [styles.cover, pressed && styles.pressed]}
      >
        {isImageUrl(coverImageUrl) ? (
          <Image
            contentFit="cover"
            source={coverImageUrl.trim()}
            style={styles.fill}
          />
        ) : (
          <View style={[styles.fill, styles.coverPlaceholder]}>
            <SymbolView
              name={{
                ios: "storefront",
                android: "storefront",
                web: "storefront",
              }}
              size={45}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={[styles.fill, styles.overlay]} />
        {onPressCoverImage ? (
          <View style={styles.coverHint}>
            <AppText color="onPrimary" variant="bodySmall">
              Kapak fotoğrafını değiştir
            </AppText>
          </View>
        ) : null}
      </Pressable>

      <View style={styles.summary}>
        <Pressable
          accessibilityLabel="Profil fotoğrafını değiştir"
          disabled={!onPressProfileImage}
          onPress={onPressProfileImage}
          style={({ pressed }) => [
            styles.avatarFrame,
            pressed && styles.pressed,
          ]}
        >
          {isImageUrl(profileImageUrl) ? (
            <Image
              contentFit="cover"
              source={profileImageUrl.trim()}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText color="primary" style={styles.initial} variant="heading">
                {initial}
              </AppText>
            </View>
          )}
        </Pressable>
        <View style={styles.copy}>
          <AppText numberOfLines={2} style={styles.name} variant="heading">
            {name.trim() || "İşletme adı"}
          </AppText>
          <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
            {address.trim() || "Adres bilgisi bekleniyor"}
          </AppText>
        </View>
        <View style={[styles.badge, !isDiscoverable && styles.hiddenBadge]}>
          <AppText
            color={isDiscoverable ? "primary" : "textMuted"}
            variant="bodySmall"
          >
            {isDiscoverable ? "Keşfette" : "Gizli"}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
  cover: {
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: 140,
    overflow: "hidden",
  },
  fill: { bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  overlay: { backgroundColor: "rgba(24, 18, 14, 0.2)" },
  coverHint: {
    backgroundColor: "rgba(24, 18, 14, 0.64)",
    borderRadius: radius.pill,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    position: "absolute",
    right: spacing.sm,
  },
  summary: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 78,
    paddingLeft: 91,
    paddingRight: spacing.sm,
  },
  avatarFrame: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 70,
    left: spacing.md,
    padding: 4,
    position: "absolute",
    top: -24,
    width: 70,
  },
  avatar: { borderRadius: radius.pill, height: "100%", width: "100%" },
  avatarPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
  },
  initial: { fontSize: 24, lineHeight: 30 },
  copy: { flex: 1, paddingRight: spacing.xs },
  name: { fontSize: 15, lineHeight: 20 },
  badge: {
    backgroundColor: "#FBF3DE",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hiddenBadge: { backgroundColor: colors.background },
  pressed: { opacity: 0.72 },
});
