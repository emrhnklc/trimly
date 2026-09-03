import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";

type BarbershopAccessCardProps = {
  barbershopName: string;
  error?: string | null;
  isSubmitting?: boolean;
  onSubmit: (code: string) => void | Promise<void>;
};

export function BarbershopAccessCard({
  barbershopName,
  error,
  isSubmitting = false,
  onSubmit,
}: BarbershopAccessCardProps) {
  const [code, setCode] = useState("");
  const normalizedCode = normalizeCode(code);

  return (
    <AppCard style={styles.card}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{
            ios: "lock.shield",
            android: "shield_lock",
            web: "shield_lock",
          }}
          size={27}
          tintColor={colors.primary}
        />
      </View>

      <View style={styles.badge}>
        <AppText color="primary" style={styles.badgeText} variant="bodySmall">
          ÖZEL ERİŞİM
        </AppText>
      </View>

      <AppText style={styles.title} variant="heading">
        İşletme kodunu gir
      </AppText>
      <AppText color="textMuted" style={styles.description} variant="bodySmall">
        {barbershopName}, yalnızca kodu paylaştığı müşterilerden randevu kabul
        ediyor.
      </AppText>

      <TextInput
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isSubmitting}
        maxLength={8}
        onChangeText={(value) => setCode(normalizeCode(value))}
        onSubmitEditing={() => {
          if (normalizedCode.length === 8) void onSubmit(normalizedCode);
        }}
        placeholder="8 haneli kod"
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
        selectionColor={colors.primary}
        style={styles.input}
        value={code}
      />

      {error ? (
        <AppText color="danger" style={styles.error} variant="bodySmall">
          {error}
        </AppText>
      ) : null}

      <View style={styles.button}>
        <AppButton
          disabled={normalizedCode.length !== 8 || isSubmitting}
          onPress={() => void onSubmit(normalizedCode)}
        >
          {isSubmitting ? "Kod doğrulanıyor…" : "Erişimi Aç"}
        </AppButton>
      </View>

      <AppText color="textMuted" style={styles.note} variant="bodySmall">
        Kodu işletmeden, QR bağlantısından veya özel davet mesajından
        alabilirsin.
      </AppText>
    </AppCard>
  );
}

function normalizeCode(value: string) {
  return value
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 8);
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  iconWrap: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 0.8 },
  title: {
    fontFamily: fontFamily.display,
    fontSize: 23,
    lineHeight: 29,
    marginTop: spacing.md,
    textAlign: "center",
  },
  description: { lineHeight: 20, marginTop: spacing.xs, textAlign: "center" },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: "Inter_700Bold",
    fontSize: 19,
    letterSpacing: 5,
    marginTop: spacing.lg,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    textAlign: "center",
    width: "100%",
  },
  error: { marginTop: spacing.sm, textAlign: "center" },
  button: { marginTop: spacing.md, width: "100%" },
  note: { lineHeight: 18, marginTop: spacing.md, textAlign: "center" },
});
