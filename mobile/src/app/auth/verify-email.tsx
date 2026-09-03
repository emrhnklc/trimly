import { SymbolView } from "expo-symbols";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { resendEmailVerification, verifyEmail } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type RegistrationIntent = "customer" | "owner" | "employee";

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessCode?: string | string[];
    accessSlug?: string | string[];
    devCode?: string | string[];
    email?: string | string[];
    intent?: string | string[];
  }>();
  const { signIn } = useAuth();
  const email = firstParam(params.email)?.trim().toLowerCase() ?? "";
  const intent = (firstParam(params.intent) ??
    "customer") as RegistrationIntent;
  const accessCode = firstParam(params.accessCode);
  const accessSlug = firstParam(params.accessSlug);
  const initialDevCode = firstParam(params.devCode);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(initialDevCode ?? null);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isResending, setResending] = useState(false);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(
      () => setCooldownSeconds((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  function finishAuthentication(
    result: Awaited<ReturnType<typeof verifyEmail>>,
  ) {
    void signIn(result).then(() => {
      if (accessSlug && accessCode) {
        router.replace({
          pathname: "/access/[slug]",
          params: { code: accessCode, slug: accessSlug },
        });
      } else if (intent === "owner") {
        router.replace({
          pathname: "/onboarding/business",
          params: { source: "registration" },
        });
      } else if (intent === "employee") {
        router.replace({
          pathname: "/onboarding/invitation",
          params: { source: "registration" },
        });
      } else {
        router.replace("/");
      }
    });
  }

  async function submit() {
    if (!email) {
      setError("Doğrulanacak e-posta adresi bulunamadı.");
      return;
    }
    if (code.length !== 6) {
      setError("E-postana gelen 6 haneli kodu girmelisin.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      finishAuthentication(await verifyEmail(email, code));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "E-posta doğrulanamadı.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    if (!email || cooldownSeconds > 0 || isResending) return;

    setResending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await resendEmailVerification(email);
      setDevCode(result.devVerificationCode ?? null);
      setCode("");
      setCooldownSeconds(60);
      setSuccess("Yeni doğrulama kodu gönderildi.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Yeni kod gönderilemedi.",
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthScreenLayout
      description={`${email} adresine gönderdiğimiz kodu gir.`}
      onBackPress={() => router.replace("/auth/login")}
      title="E-postanı doğrula"
    >
      <AppCard style={styles.card}>
        <View style={styles.iconShell}>
          <SymbolView
            name={{
              ios: "envelope.badge",
              android: "mark_email_unread",
              web: "mark_email_unread",
            }}
            size={30}
            tintColor={colors.primary}
          />
        </View>
        <AppText style={styles.cardTitle} variant="heading">
          Doğrulama kodu
        </AppText>
        <AppText
          color="textMuted"
          style={styles.cardDescription}
          variant="bodySmall"
        >
          Kod 10 dakika geçerlidir ve yalnızca bir kez kullanılabilir.
        </AppText>

        <View style={styles.codeField}>
          <AuthTextField
            autoComplete="one-time-code"
            icon={{ ios: "number", android: "pin", web: "pin" }}
            keyboardType="number-pad"
            label="6 haneli kod"
            maxLength={6}
            onChangeText={(value) => {
              setCode(value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            onSubmitEditing={() => void submit()}
            placeholder="000000"
            returnKeyType="done"
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
        {error ? (
          <AppText color="danger" style={styles.message}>
            {error}
          </AppText>
        ) : null}
        {success ? (
          <AppText color="primary" style={styles.message}>
            {success}
          </AppText>
        ) : null}

        <View style={styles.primaryAction}>
          <AppButton
            disabled={isSubmitting || code.length !== 6}
            onPress={() => void submit()}
          >
            {isSubmitting ? "Doğrulanıyor…" : "E-postamı Doğrula"}
          </AppButton>
        </View>
        <AppButton
          disabled={cooldownSeconds > 0 || isResending}
          onPress={() => void resend()}
          variant="ghost"
        >
          {isResending
            ? "Gönderiliyor…"
            : cooldownSeconds > 0
              ? `Yeni kod gönder (${cooldownSeconds} sn)`
              : "Yeni kod gönder"}
        </AppButton>
      </AppCard>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "stretch", marginTop: spacing.xl, padding: spacing.lg },
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
  cardDescription: { marginTop: spacing.xs, textAlign: "center" },
  codeField: { marginTop: spacing.xl },
  developmentCode: {
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    gap: spacing.xxs,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  message: { marginTop: spacing.md, textAlign: "center" },
  primaryAction: { marginTop: spacing.lg },
});
