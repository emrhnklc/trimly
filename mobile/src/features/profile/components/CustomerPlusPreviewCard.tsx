import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { CachedImageBackground } from "@/components/ui/CachedImageBackground";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function CustomerPlusPreviewCard({ onPress }: { onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel="Trimly Plus hakkında bilgi al"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.darkSurface },
        pressed && styles.pressed,
      ]}
    >
      <CachedImageBackground
        imageStyle={styles.backgroundImage}
        source={require("../../../../assets/images/profile-last-haircut.jpg")}
        style={styles.background}
      >
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={[styles.iconBox, { borderColor: colors.primary }]}>
            <SymbolView
              name={{
                ios: "crown.fill",
                android: "workspace_premium",
                web: "workspace_premium",
              }}
              size={22}
              tintColor={colors.primary}
            />
          </View>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <AppText color="onPrimary" style={styles.title} variant="heading">
                Trimly Plus
              </AppText>
              <View style={styles.badge}>
                <AppText
                  color="onPrimary"
                  style={styles.badgeText}
                  variant="overline"
                >
                  YAKINDA
                </AppText>
              </View>
            </View>
            <AppText
              color="onPrimary"
              style={styles.description}
              variant="bodySmall"
            >
              Stil hafızası, öncelikli boş slotlar ve daha fazlası.
            </AppText>
          </View>
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={21}
            tintColor={colors.onPrimary}
          />
        </View>
      </CachedImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    marginTop: spacing.md,
    minHeight: 94,
    overflow: "hidden",
  },
  background: { minHeight: 94 },
  backgroundImage: { borderRadius: radius.card },
  overlay: {
    backgroundColor: "rgba(12, 8, 5, 0.62)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  content: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  iconBox: {
    alignItems: "center",
    backgroundColor: "rgba(25, 17, 9, 0.62)",
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  titleRow: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  title: { fontSize: 18, lineHeight: 23 },
  description: { marginTop: 2 },
  badge: {
    backgroundColor: "rgba(255, 252, 247, 0.18)",
    borderColor: "rgba(255, 244, 215, 0.72)",
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 8, lineHeight: 10 },
  pressed: { opacity: 0.72 },
});
