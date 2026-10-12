import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import type { PublicBarber } from "@/features/barbershops/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type BarberPreviewCardProps = {
  barber: PublicBarber;
  onPress: () => void;
  isBookingOpen?: boolean;
  compact?: boolean;
};

const roleLabels: Record<PublicBarber["role"], string> = {
  OWNER: "İşletme sahibi",
  MANAGER: "Yönetici",
  BARBER: "Berber",
};

export function BarberPreviewCard({
  barber,
  onPress,
  isBookingOpen = true,
  compact = false,
}: BarberPreviewCardProps) {
  const colors = useThemeColors();
  const fullName = `${barber.user.firstName} ${barber.user.lastName}`;
  const initials = `${barber.user.firstName[0] ?? ""}${barber.user.lastName[0] ?? ""}`;

  return (
    <Pressable
      accessibilityLabel={`${fullName} profilini incele`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        compact && styles.compactRoot,
        pressed && styles.pressed,
      ]}
    >
      <AppCard style={[styles.card, compact && styles.compactCard]}>
        {barber.user.profileImageUrl ? (
          <Image
            accessibilityLabel={`${fullName} profil fotoğrafı`}
            contentFit="cover"
            source={barber.user.profileImageUrl}
            style={[
              styles.avatar,
              compact && styles.compactAvatar,
              { borderColor: colors.primary },
            ]}
            transition={150}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              compact && styles.compactAvatar,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.primary,
              },
            ]}
          >
            <AppText color="primary" variant="label">
              {initials}
            </AppText>
          </View>
        )}
        <View style={[styles.content, compact && styles.compactContent]}>
          <AppText
            variant="cardTitle"
            numberOfLines={compact ? 2 : undefined}
            style={compact && styles.compactName}
          >
            {fullName}
          </AppText>
          <AppText
            color="textMuted"
            numberOfLines={compact ? 1 : undefined}
            style={styles.role}
            variant="bodySmall"
          >
            {roleLabels[barber.role]}
          </AppText>
          {!compact && barber.serviceNames?.length ? (
            <AppText
              variant="bodySmall"
              style={styles.services}
              numberOfLines={2}
            >
              {barber.serviceNames.slice(0, 3).join(" · ")}
              {barber.serviceNames.length > 3
                ? ` · +${barber.serviceNames.length - 3} hizmet`
                : ""}
            </AppText>
          ) : null}
          {!compact ? (
            <View style={styles.stats}>
              <AppText color="primary" variant="label" style={styles.statText}>
                ★ {barber.ratingAverage?.toFixed(1) ?? "—"}
              </AppText>
              <AppText variant="bodySmall" style={styles.statText}>
                {(barber.ratingCount ?? 0).toLocaleString("tr-TR")}{" "}
                değerlendirme
              </AppText>
              <AppText variant="bodySmall" style={styles.statText}>
                {(barber.completedCount ?? 0).toLocaleString("tr-TR")}{" "}
                tamamlanan randevu
              </AppText>
            </View>
          ) : null}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: isBookingOpen
                    ? colors.success
                    : colors.danger,
                },
              ]}
            />
            <AppText
              color="textMuted"
              variant="bodySmall"
              style={[styles.statusText, compact && styles.compactStatusText]}
            >
              {isBookingOpen ? "Randevuya açık" : "Randevuya kapalı"}
            </AppText>
          </View>
        </View>
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={compact ? 14 : 17}
          tintColor={colors.textMuted}
        />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.sm,
    minHeight: 76,
    paddingVertical: spacing.sm,
  },
  compactRoot: { flex: 1 },
  compactCard: {
    flex: 1,
    marginBottom: 0,
    padding: spacing.xs,
    minHeight: 88,
  },
  compactAvatar: { width: 42, height: 42 },
  compactName: { fontSize: 14, lineHeight: 19 },
  compactContent: { marginLeft: spacing.xs },
  statusText: { flexShrink: 1 },
  compactStatusText: { fontSize: 12, lineHeight: 16 },
  avatar: { borderRadius: radius.pill, height: 58, width: 58, borderWidth: 1 },
  placeholder: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 58,
    borderWidth: 1,
    justifyContent: "center",
    width: 58,
  },
  content: { flex: 1, minWidth: 0, marginLeft: spacing.sm },
  role: { marginTop: 1 },
  services: { marginTop: spacing.xs },
  stats: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: spacing.xs,
    rowGap: 2,
    marginTop: spacing.xs,
  },
  statText: { fontSize: 12, lineHeight: 18 },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 2,
  },
  statusDot: { borderRadius: radius.pill, height: 6, width: 6 },
  pressed: { opacity: 0.72 },
});
