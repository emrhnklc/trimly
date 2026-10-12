import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function ProfileServiceRow({
  service,
  onPress,
  disabled = false,
  bookingLabel = false,
}: {
  service: { name: string; price: string; durationMinutes: number };
  onPress?: () => void;
  disabled?: boolean;
  bookingLabel?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView
          name={{ ios: "scissors", android: "content_cut", web: "content_cut" }}
          size={26}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="cardTitle">{service.name}</AppText>
        <AppText color="textMuted" variant="bodySmall">
          {service.durationMinutes} dk
          {bookingLabel
            ? ` · ₺${Number(service.price).toLocaleString("tr-TR")}`
            : ""}
        </AppText>
      </View>
      {bookingLabel ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${service.name} için randevu al`}
          disabled={disabled}
          onPress={onPress}
          style={[
            styles.button,
            { borderColor: colors.primary },
            disabled && styles.disabled,
          ]}
        >
          <AppText color="primary" variant="label" style={styles.buttonText}>
            Randevu Al
          </AppText>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${service.name}, ${service.durationMinutes} dakika, ${service.price} lira, randevu al`}
          disabled={disabled || !onPress}
          onPress={onPress}
          style={styles.price}
        >
          <AppText color="primary" variant="cardTitle">
            ₺{Number(service.price).toLocaleString("tr-TR")}
          </AppText>
        </Pressable>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.card,
    minHeight: 82,
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 4 },
  button: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },
  buttonText: { fontSize: 12 },
  price: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    paddingVertical: 12,
  },
  disabled: { opacity: 0.45 },
});
