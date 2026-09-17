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
};

const roleLabels: Record<PublicBarber["role"], string> = {
  OWNER: "İşletme sahibi",
  MANAGER: "Yönetici",
  BARBER: "Berber",
};

export function BarberPreviewCard({ barber, onPress }: BarberPreviewCardProps) {
  const colors = useThemeColors();
  const fullName = `${barber.user.firstName} ${barber.user.lastName}`;
  const initials = `${barber.user.firstName[0] ?? ""}${barber.user.lastName[0] ?? ""}`;

  return (
    <Pressable
      accessibilityLabel={`${fullName} ile randevu al`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <AppCard style={styles.card}>
        {barber.user.profileImageUrl ? (
          <Image
            accessibilityLabel={`${fullName} profil fotoğrafı`}
            contentFit="cover"
            source={barber.user.profileImageUrl}
            style={styles.avatar}
            transition={150}
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <AppText color="primary" variant="label">
              {initials}
            </AppText>
          </View>
        )}
        <View style={styles.content}>
          <AppText variant="cardTitle">{fullName}</AppText>
          <AppText color="textMuted" style={styles.role} variant="bodySmall">
            {roleLabels[barber.role]}
          </AppText>
          <View style={styles.statusRow}>
            <View
              style={[styles.statusDot, { backgroundColor: colors.success }]}
            />
            <AppText color="textMuted" variant="bodySmall">
              Randevuya açık
            </AppText>
          </View>
        </View>
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={17}
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
  avatar: { borderRadius: radius.pill, height: 44, width: 44 },
  placeholder: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  content: { flex: 1, marginLeft: spacing.sm },
  role: { marginTop: 1 },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 2,
  },
  statusDot: { borderRadius: radius.pill, height: 6, width: 6 },
  pressed: { opacity: 0.72 },
});
