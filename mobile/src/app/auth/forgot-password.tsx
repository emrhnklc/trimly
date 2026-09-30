import { SymbolView } from "expo-symbols";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { requestPasswordReset, resetPassword } from "@/features/auth/api";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { isStrongPassword } from "@/features/auth/validation";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessCode?: string | string[];
    accessSlug?: string | string[];
    email?: string | string[];
    invitationToken?: string | string[];
  }>();
  const accessCode = firstParam(params.accessCode);
  const accessSlug = firstParam(params.accessSlug);
  const invitationToken = firstParam(params.invitationToken);
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState(firstParam(params.email) ?? "");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(
      () => setCooldownSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  function goBack() {
    if (step === "reset") {
      setStep("email");
      setError(null);
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace({
      pathname: "/auth/login",
      params: {
        ...(email.trim() ? { email: email.trim().toLowerCase() } : {}),
        ...(accessSlug && accessCode ? { accessCode, accessSlug } : {}),
        ...(invitationToken ? { invitationToken } : {}),
      },
    });
  }

  async function sendCode() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError("Geçerli bir e-posta adresi girmelisin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await requestPasswordReset(normalizedEmail);
      setEmail(normalizedEmail);
      setDevCode(result.devResetCode ?? null);
      setCooldownSeconds(60);
      setStep("reset");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kod gönderilemedi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitNewPassword() {
    if (code.length !== 6) {
      setError("E-postana gelen 6 haneli kodu girmelisin.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Yeni şifren tüm güvenlik şartlarını karşılamalıdır.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(email, code, password);
      router.replace({
        pathname: "/auth/login",
        params: {
          email,
          passwordReset: "true",
          ...(accessSlug && accessCode ? { accessCode, accessSlug } : {}),
          ...(invitationToken ? { invitationToken } : {}),
        },
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Şifre yenilenemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      description={
        step === "email"
          ? "Hesabında kullandığın e-posta adresini yaz."
          : `${email} adresine gönderdiğimiz kodla yeni şifreni oluştur.`
      }
      onBackPress={goBack}
      title={step === "email" ? "Şifreni yenile" : "Yeni şifreni oluştur"}
    >
      <AppCard style={styles.card}>
        <View style={styles.iconShell}>
          <SymbolView
            name={{
              ios: "lock.rotation",
              android: "lock_reset",
              web: "lock_reset",
            }}
            size={30}
            tintColor={colors.primary}
          />
        </View>

        {step === "email" ? (
          <>
            <AppText style={styles.cardTitle} variant="heading">
              Sıfırlama kodu iste
            </AppText>
            <AppText
              color="textMuted"
              style={styles.description}
              variant="bodySmall"
            >
              Güvenlik nedeniyle bu e-postayla bir hesap bulunup bulunmadığını
              açıklamayız.
            </AppText>
            <View style={styles.firstField}>
              <AuthTextField
                autoCapitalize="none"
                autoComplete="email"
                icon={{ ios: "envelope", android: "mail", web: "mail" }}
                keyboardType="email-address"
                label="E-posta"
                onChangeText={setEmail}
                onSubmitEditing={() => void sendCode()}
                placeholder="ornek@mail.com"
                returnKeyType="send"
                value={email}
              />
            </View>
            {error ? (
              <AppText color="danger" style={styles.message}>
                {error}
              </AppText>
            ) : null}
            <View style={styles.action}>
              <AppButton
                disabled={isSubmitting}
                onPress={() => void sendCode()}
              >
                {isSubmitting ? "Gönderiliyor…" : "Kod Gönder"}
              </AppButton>
            </View>
          </>
        ) : (
          <>
            <AppText style={styles.cardTitle} variant="heading">
              Güvenli yeni şifre
            </AppText>
            <View style={styles.firstField}>
              <AuthTextField
                autoComplete="one-time-code"
                icon={{ ios: "number", android: "pin", web: "pin" }}
                keyboardType="number-pad"
                label="6 haneli kod"
                maxLength={6}
                onChangeText={(value) =>
                  setCode(value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                value={code}
              />
            </View>
            {devCode ? (
              <View style={styles.developmentCode}>
                <AppText color="textMuted" variant="bodySmall">
                  Local geliştirme kodu
                </AppText>
                <AppText selectable color="primary" variant="heading">
                  {devCode}
                </AppText>
              </View>
            ) : null}
            <AuthTextField
              autoComplete="new-password"
              icon={{ ios: "lock", android: "lock", web: "lock" }}
              label="Yeni şifre"
              onChangeText={setPassword}
              placeholder="En az 8 karakter"
              secureTextEntry
              value={password}
            />
            <AuthTextField
              autoComplete="new-password"
              icon={{
                ios: "checkmark.shield",
                android: "verified_user",
                web: "verified_user",
              }}
              label="Yeni şifreyi doğrula"
              onChangeText={setPasswordConfirmation}
              onSubmitEditing={() => void submitNewPassword()}
              placeholder="Şifreni tekrar yaz"
              returnKeyType="done"
              secureTextEntry
              value={passwordConfirmation}
            />
            <PasswordRequirements
              confirmation={passwordConfirmation}
              password={password}
            />
            {error ? (
              <AppText color="danger" style={styles.message}>
                {error}
              </AppText>
            ) : null}
            <View style={styles.action}>
              <AppButton
                disabled={isSubmitting}
                onPress={() => void submitNewPassword()}
              >
                {isSubmitting ? "Şifre yenileniyor…" : "Şifremi Yenile"}
              </AppButton>
            </View>
            <AppButton
              disabled={cooldownSeconds > 0 || isSubmitting}
              onPress={() => void sendCode()}
              variant="ghost"
            >
              {cooldownSeconds > 0
                ? `Yeni kod gönder (${cooldownSeconds} sn)`
                : "Yeni kod gönder"}
            </AppButton>
          </>
        )}
      </AppCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.xl, padding: spacing.lg },
  iconShell: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: "center",
    width: 58,
  },
  cardTitle: { marginTop: spacing.md, textAlign: "center" },
  description: { marginTop: spacing.xs, textAlign: "center" },
  firstField: { marginTop: spacing.xl },
  developmentCode: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.xxs,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  message: { marginTop: spacing.md, textAlign: "center" },
  action: { marginTop: spacing.lg },
});
