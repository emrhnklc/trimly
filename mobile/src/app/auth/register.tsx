import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { register } from "@/features/auth/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import { PasswordRequirements } from "@/features/auth/components/PasswordRequirements";
import { RegistrationIntentCard } from "@/features/auth/components/RegistrationIntentCard";
import {
  formatTurkishMobileInput,
  isStrongPassword,
  normalizeTurkishMobile,
} from "@/features/auth/validation";
import { spacing } from "@/theme/spacing";

type RegistrationIntent = "customer" | "owner" | "employee";

export default function RegisterScreen() {
  const router = useRouter();
  const { accessCode, accessSlug } = useLocalSearchParams<{
    accessCode?: string;
    accessSlug?: string;
  }>();
  const { signIn } = useAuth();
  const [step, setStep] = useState<"intent" | "account">("intent");
  const [intent, setIntent] = useState<RegistrationIntent | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goBack() {
    if (step === "account") {
      setStep("intent");
      setError(null);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace("/auth/login");
  }

  function continueToAccount() {
    if (!intent) {
      setError("Devam etmek için Trimly’yi nasıl kullanacağını seç.");
      return;
    }

    setError(null);
    setStep("account");
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError("Ad, soyad, e-posta ve şifre zorunludur.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("Şifren tüm güvenlik şartlarını karşılamalıdır.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    const normalizedPhone = phone.trim() ? normalizeTurkishMobile(phone) : null;
    if (phone.trim() && !normalizedPhone) {
      setError("Geçerli bir Türkiye cep telefonu numarası girmelisin.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await register({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      });
      await signIn(result);

      requestAnimationFrame(() => {
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
        }
        else if (intent === "employee")
          router.replace({
            pathname: "/onboarding/invitation",
            params: { source: "registration" },
          });
        else router.replace("/");
      });
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Hesap oluşturulamadı.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      description={
        step === "intent"
          ? "Sana doğru başlangıcı hazırlayabilmemiz için bir seçenek belirle."
          : "Birkaç bilgiyle hesabını aç. Seçimini daha sonra değiştirebilirsin."
      }
      onBackPress={goBack}
      title={
        step === "intent"
          ? "Trimly’yi nasıl kullanacaksın?"
          : "Hesabını oluşturalım."
      }
    >
      {step === "intent" ? (
        <>
          <View accessibilityRole="radiogroup" style={styles.intentList}>
            <RegistrationIntentCard
              description="Berberleri keşfet, uygun saati seç ve randevunu yönet."
              icon={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              isSelected={intent === "customer"}
              onPress={() => {
                setIntent("customer");
                setError(null);
              }}
              title="Randevu almak istiyorum"
            />
            <RegistrationIntentCard
              description="Salonunu oluştur, çalışanlarını ve randevularını yönet."
              icon={{
                ios: "storefront",
                android: "storefront",
                web: "storefront",
              }}
              isSelected={intent === "owner"}
              onPress={() => {
                setIntent("owner");
                setError(null);
              }}
              title="İşletmemi oluşturmak istiyorum"
            />
            <RegistrationIntentCard
              description="İşletme sahibinden aldığın davetle ekibe katıl."
              icon={{ ios: "person.2", android: "group", web: "group" }}
              isSelected={intent === "employee"}
              onPress={() => {
                setIntent("employee");
                setError(null);
              }}
              title="Bir işletmeye çalışan olarak katılacağım"
            />
          </View>
          {error ? (
            <AppText color="danger" style={styles.error}>
              {error}
            </AppText>
          ) : null}
          <View style={styles.intentAction}>
            <AppButton onPress={continueToAccount}>Devam Et</AppButton>
          </View>
        </>
      ) : (
        <>
          <AppCard style={styles.formCard}>
            <View style={styles.nameRow}>
              <View style={styles.nameField}>
                <AuthTextField
                  autoComplete="given-name"
                  icon={{ ios: "person", android: "person", web: "person" }}
                  label="Ad"
                  onChangeText={setFirstName}
                  placeholder="Adın"
                  value={firstName}
                />
              </View>
              <View style={styles.nameField}>
                <AuthTextField
                  autoComplete="family-name"
                  icon={{ ios: "person", android: "person", web: "person" }}
                  label="Soyad"
                  onChangeText={setLastName}
                  placeholder="Soyadın"
                  value={lastName}
                />
              </View>
            </View>
            <AuthTextField
              autoCapitalize="none"
              autoComplete="email"
              icon={{ ios: "envelope", android: "mail", web: "mail" }}
              keyboardType="email-address"
              label="E-posta"
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              value={email}
            />
            <AuthTextField
              autoComplete="tel"
              icon={{ ios: "phone", android: "phone", web: "phone" }}
              keyboardType="phone-pad"
              label="Telefon (isteğe bağlı)"
              maxLength={17}
              onChangeText={(value) =>
                setPhone(formatTurkishMobileInput(value))
              }
              placeholder="+90 5xx xxx xx xx"
              value={phone}
            />
            <AuthTextField
              autoComplete="new-password"
              icon={{ ios: "lock", android: "lock", web: "lock" }}
              label="Şifre"
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
              label="Şifreyi doğrula"
              onChangeText={setPasswordConfirmation}
              onSubmitEditing={() => void submit()}
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
              <AppText color="danger" style={styles.error}>
                {error}
              </AppText>
            ) : null}
            <AppText color="textMuted" style={styles.legal} variant="bodySmall">
              Hesap oluşturarak Trimly’nin kullanım ve gizlilik koşullarını
              kabul etmiş olursun.
            </AppText>
            <View style={styles.action}>
              <AppButton disabled={isSubmitting} onPress={() => void submit()}>
                {isSubmitting ? "Hesabın hazırlanıyor…" : "Hesap Oluştur"}
              </AppButton>
            </View>
          </AppCard>

          <View style={styles.footer}>
            <AppText color="textMuted">Zaten hesabın var mı?</AppText>
            <AppButton
              disabled={isSubmitting}
              onPress={() => router.replace("/auth/login")}
              variant="ghost"
            >
              Giriş Yap
            </AppButton>
          </View>
        </>
      )}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formCard: { marginTop: spacing.xl, padding: spacing.lg },
  intentList: { gap: spacing.sm, marginTop: spacing.xl },
  intentAction: { marginTop: spacing.xl },
  nameRow: { flexDirection: "row", gap: spacing.sm },
  nameField: { flex: 1 },
  error: { marginTop: spacing.md },
  legal: { marginTop: spacing.lg },
  action: { marginTop: spacing.lg },
  footer: { alignItems: "center", marginTop: spacing.lg },
});
