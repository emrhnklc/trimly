import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { register } from "@/features/auth/api";
import {
  formatTurkishMobileInput,
  isStrongPassword,
  normalizeTurkishMobile,
} from "@/features/auth/validation";
import {
  LocationSelectField,
  type LocationOption,
} from "@/features/locations/components/LocationSelectField";
import {
  getDistricts,
  getNeighborhoods,
  getProvinces,
} from "@/features/locations/api";
import { birthDateInputToIso } from "@/features/profile/birth-date";
import { BirthDatePickerField } from "@/features/profile/components/BirthDatePickerField";
import { spacing } from "@/theme/spacing";
import { AuthTextField } from "./AuthTextField";
import { PasswordRequirements } from "./PasswordRequirements";

export type RegistrationIntent = "customer" | "owner" | "employee";

type Props = {
  accessCode?: string;
  accessSlug?: string;
  intent: RegistrationIntent;
  invitationToken?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AccountRegistrationForm({
  accessCode,
  accessSlug,
  intent,
  invitationToken,
}: Props) {
  const router = useRouter();
  const isCustomer = intent === "customer";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [province, setProvince] = useState<LocationOption | null>(null);
  const [district, setDistrict] = useState<LocationOption | null>(null);
  const [neighborhood, setNeighborhood] = useState<LocationOption | null>(null);
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationOption[]>([]);
  const [isLoadingProvinces, setLoadingProvinces] = useState(isCustomer);
  const [isLoadingDistricts, setLoadingDistricts] = useState(false);
  const [isLoadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPhone = phone.trim() ? normalizeTurkishMobile(phone) : null;
  const normalizedBirthDate = birthDate ? birthDateInputToIso(birthDate) : null;
  const canSubmit = useMemo(
    () =>
      Boolean(
        firstName.trim() &&
          lastName.trim() &&
          emailPattern.test(email.trim()) &&
          (!phone.trim() || normalizedPhone) &&
          (!birthDate || normalizedBirthDate) &&
          (!isCustomer || (province && district)) &&
          isStrongPassword(password) &&
          password === passwordConfirmation,
      ),
    [
      birthDate,
      district,
      email,
      firstName,
      isCustomer,
      lastName,
      normalizedBirthDate,
      normalizedPhone,
      password,
      passwordConfirmation,
      phone,
      province,
    ],
  );

  useEffect(() => {
    if (!isCustomer || provinces.length) return;
    let isActive = true;
    getProvinces()
      .then((items) => {
        if (isActive) {
          setProvinces(
            items.map((item) => ({ label: item.name, value: item.code })),
          );
        }
      })
      .catch(() => {
        if (isActive) {
          setError("İl listesi alınamadı. Bağlantını kontrol edip tekrar dene.");
        }
      })
      .finally(() => {
        if (isActive) setLoadingProvinces(false);
      });
    return () => {
      isActive = false;
    };
  }, [isCustomer, provinces.length]);

  async function selectProvince(option: LocationOption) {
    setProvince(option);
    setDistrict(null);
    setNeighborhood(null);
    setDistricts([]);
    setNeighborhoods([]);
    setLoadingDistricts(true);
    setError(null);
    try {
      const items = await getDistricts(option.value);
      setDistricts(items.map((item) => ({ label: item, value: item })));
    } catch {
      setError("İlçe listesi alınamadı. Lütfen tekrar dene.");
    } finally {
      setLoadingDistricts(false);
    }
  }

  async function selectDistrict(option: LocationOption) {
    if (!province) return;
    setDistrict(option);
    setNeighborhood(null);
    setNeighborhoods([]);
    setLoadingNeighborhoods(true);
    setError(null);
    try {
      const items = await getNeighborhoods(province.value, option.value);
      setNeighborhoods(items.map((item) => ({ label: item, value: item })));
    } catch {
      setError("Mahalle listesi alınamadı. Lütfen tekrar dene.");
    } finally {
      setLoadingNeighborhoods(false);
    }
  }

  async function submit() {
    if (!canSubmit) {
      setError("Zorunlu alanları doğru biçimde tamamlamalısın.");
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
        ...(normalizedBirthDate ? { birthDate: normalizedBirthDate } : {}),
        ...(isCustomer && province && district
          ? {
              provinceCode: province.value,
              province: province.label,
              district: district.label,
              ...(neighborhood ? { neighborhood: neighborhood.label } : {}),
            }
          : {}),
      });
      router.replace({
        pathname: "/auth/verify-email",
        params: {
          email: result.email,
          intent,
          ...(result.devVerificationCode
            ? { devCode: result.devVerificationCode }
            : {}),
          ...(accessSlug && accessCode ? { accessCode, accessSlug } : {}),
          ...(invitationToken ? { invitationToken } : {}),
        },
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
    <>
      <AppCard style={styles.formCard}>
        <AppText style={styles.groupTitle} variant="cardTitle">
          Kişisel Bilgiler
        </AppText>
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
          onChangeText={(value) => setPhone(formatTurkishMobileInput(value))}
          placeholder="+90 5xx xxx xx xx"
          value={phone}
        />
        <BirthDatePickerField
          onChange={setBirthDate}
          optional
          value={birthDate}
        />
      </AppCard>

      {isCustomer ? (
        <AppCard style={styles.formCard}>
          <AppText style={styles.groupTitle} variant="cardTitle">
            Konum
          </AppText>
          <AppText color="textMuted" variant="bodySmall">
            İl ve ilçe, sana yakın işletmeleri gösterebilmemiz için gereklidir.
          </AppText>
          <View style={styles.locationFields}>
            <LocationSelectField
              label="İl"
              loading={isLoadingProvinces}
              onChange={(option) => void selectProvince(option)}
              options={provinces}
              placeholder="İl seç"
              value={province}
            />
            <LocationSelectField
              disabled={!province}
              label="İlçe"
              loading={isLoadingDistricts}
              onChange={(option) => void selectDistrict(option)}
              options={districts}
              placeholder="Önce il seç"
              value={district}
            />
            <LocationSelectField
              disabled={!district}
              label="Mahalle (isteğe bağlı)"
              loading={isLoadingNeighborhoods}
              onChange={setNeighborhood}
              options={neighborhoods}
              placeholder="Önce ilçe seç"
              value={neighborhood}
            />
          </View>
        </AppCard>
      ) : null}

      <AppCard style={styles.formCard}>
        <AppText style={styles.groupTitle} variant="cardTitle">
          Güvenlik
        </AppText>
        <AuthTextField
          autoComplete="new-password"
          icon={{ ios: "lock", android: "lock", web: "lock" }}
          label="Şifre"
          onChangeText={setPassword}
          placeholder="Güçlü bir şifre oluştur"
          secureTextEntry
          showPasswordToggle
          value={password}
        />
        <AuthTextField
          autoComplete="new-password"
          icon={{
            ios: "checkmark.shield",
            android: "verified_user",
            web: "verified_user",
          }}
          label="Şifre tekrar"
          onChangeText={setPasswordConfirmation}
          onSubmitEditing={() => void submit()}
          placeholder="Şifreni tekrar yaz"
          returnKeyType="done"
          secureTextEntry
          showPasswordToggle
          value={passwordConfirmation}
        />
        <PasswordRequirements
          confirmation={passwordConfirmation}
          password={password}
        />
      </AppCard>

      {error ? (
        <AppText color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppText color="textMuted" style={styles.legal} variant="bodySmall">
        Hesap oluşturarak {" "}
        <AppText
          color="primary"
          onPress={() =>
            router.push({
              pathname: "/legal/[document]",
              params: { document: "terms" },
            })
          }
          variant="bodySmall"
        >
          Kullanım Koşulları
        </AppText>
        {" ve "}
        <AppText
          color="primary"
          onPress={() =>
            router.push({
              pathname: "/legal/[document]",
              params: { document: "privacy" },
            })
          }
          variant="bodySmall"
        >
          Gizlilik Politikası
        </AppText>
        ’nı kabul etmiş olursun.
      </AppText>

      <View style={styles.action}>
        <AppButton
          disabled={!canSubmit || isSubmitting}
          onPress={() => void submit()}
        >
          {isSubmitting ? "Hesabın hazırlanıyor…" : "Hesap Oluştur"}
        </AppButton>
      </View>
      <View style={styles.footer}>
        <AppText color="textMuted">Zaten hesabın var mı?</AppText>
        <AppButton
          disabled={isSubmitting}
          onPress={() =>
            router.replace({
              pathname: "/auth/login",
              params: invitationToken ? { invitationToken } : {},
            })
          }
          variant="ghost"
        >
          Giriş Yap
        </AppButton>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  formCard: { marginTop: spacing.md, padding: spacing.md },
  groupTitle: { marginBottom: spacing.xxs },
  nameRow: { flexDirection: "row", gap: spacing.sm },
  nameField: { flex: 1 },
  locationFields: { gap: spacing.sm, marginTop: spacing.md },
  error: { marginTop: spacing.md, textAlign: "center" },
  legal: {
    lineHeight: 19,
    marginTop: spacing.md,
    paddingHorizontal: spacing.xs,
    textAlign: "center",
  },
  action: { marginTop: spacing.md },
  footer: { alignItems: "center", marginTop: spacing.md },
});
