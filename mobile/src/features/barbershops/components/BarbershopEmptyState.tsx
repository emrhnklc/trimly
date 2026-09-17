import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function BarbershopEmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: SymbolViewProps["name"];
  title: string;
}) {
  const colors = useThemeColors();

  return (
    <AppCard style={styles.card}>
      <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={icon} size={20} tintColor={colors.primary} />
      </View>
      <View style={styles.content}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText
          color="textMuted"
          style={styles.description}
          variant="bodySmall"
        >
          {description}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", flexDirection: "row", minHeight: 84 },
  icon: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  content: { flex: 1, marginLeft: spacing.sm },
  description: { marginTop: 2 },
});
