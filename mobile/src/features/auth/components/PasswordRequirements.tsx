import { SymbolView } from "expo-symbols";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { passwordRequirements } from "../validation";

type PasswordRequirementsProps = {
  confirmation: string;
  password: string;
};

export function PasswordRequirements({
  confirmation,
  password,
}: PasswordRequirementsProps) {
  const colors = useThemeColors();
  if (!password) return null;

  const items = [
    ...passwordRequirements.map((requirement) => ({
      id: requirement.id,
      isValid: requirement.test(password),
      label: requirement.label,
    })),
    {
      id: "confirmation",
      isValid: Boolean(confirmation) && password === confirmation,
      label: "Şifreler birbiriyle eşleşiyor",
    },
  ];

  return (
    <View accessibilityLabel="Şifre şartları" style={styles.container}>
      <AppText style={styles.title} variant="bodySmall">
        Güvenli şifre şartları
      </AppText>
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.row}>
            <SymbolView
              name={
                item.isValid
                  ? {
                      ios: "checkmark.circle.fill",
                      android: "check_circle",
                      web: "check_circle",
                    }
                  : {
                      ios: "circle",
                      android: "radio_button_unchecked",
                      web: "radio_button_unchecked",
                    }
              }
              size={16}
              tintColor={item.isValid ? colors.primary : colors.textMuted}
            />
            <AppText
              color={item.isValid ? "text" : "textMuted"}
              variant="bodySmall"
            >
              {item.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.sm },
  title: { fontFamily: "Inter_700Bold" },
  list: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    minWidth: "47%",
  },
});
