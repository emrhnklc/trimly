import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import {
  AccountRegistrationForm,
  type RegistrationIntent,
} from "@/features/auth/components/AccountRegistrationForm";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { RegistrationIntentCard } from "@/features/auth/components/RegistrationIntentCard";
import { spacing } from "@/theme/spacing";

export default function RegisterScreen() {
  const router = useRouter();
  const { accessCode, accessSlug, invitationToken } = useLocalSearchParams<{
    accessCode?: string;
    accessSlug?: string;
    invitationToken?: string;
  }>();
  const [step, setStep] = useState<"intent" | "account">(
    invitationToken ? "account" : "intent",
  );
  const [intent, setIntent] = useState<RegistrationIntent | null>(
    invitationToken ? "employee" : null,
  );
  const [error, setError] = useState<string | null>(null);

  function goBack() {
    if (step === "account" && !invitationToken) {
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

  const isCustomer = intent === "customer";

  return (
    <AuthScreenLayout
      description={
        step === "intent"
          ? "Sana doğru başlangıcı hazırlayabilmemiz için bir seçenek belirle."
          : isCustomer
            ? "Temel bilgilerini tamamla, ardından berberleri keşfetmeye başla."
            : "Hesabını oluştur; işletme veya ekip bilgilerini sonraki adımda tamamla."
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
      ) : intent ? (
        <AccountRegistrationForm
          accessCode={accessCode}
          accessSlug={accessSlug}
          intent={intent}
          invitationToken={invitationToken}
        />
      ) : null}
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  intentList: { gap: spacing.sm, marginTop: spacing.xl },
  intentAction: { marginTop: spacing.xl },
  error: { marginTop: spacing.md, textAlign: "center" },
});
