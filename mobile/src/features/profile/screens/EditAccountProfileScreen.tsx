import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useSegments } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useMemo, useState, type PropsWithChildren } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { SettingsPageHeader } from "@/components/ui/SettingsPageHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  removeMyProfilePhoto,
  updateMyProfile,
  uploadMyProfilePhoto,
} from "@/features/auth/api";
import {
  birthDateInputToIso,
  birthDateToInput,
  formatBirthDateInput,
} from "@/features/profile/birth-date";
import { layout, radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

const earliestBirthDate = new Date(1900, 0, 1);

export function EditAccountProfileScreen() {
  const router = useRouter();
  const segments = useSegments();
  const colors = useThemeColors();
  const { token, updateUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(formatTurkishPhone(user?.phone ?? ""));
  const [birthDate, setBirthDate] = useState(
    birthDateToInput(user?.birthDate ?? null),
  );
  const [draftBirthDate, setDraftBirthDate] = useState(() =>
    inputToDate(birthDate),
  );
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<{
    uri: string;
    mimeType?: string | null;
  } | null>(null);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedBirthDate = birthDate ? birthDateInputToIso(birthDate) : null;
  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      firstName.trim() !== user.firstName ||
      lastName.trim() !== user.lastName ||
      phoneDigits(phone) !== phoneDigits(user.phone ?? "") ||
      normalizedBirthDate !== (user.birthDate?.slice(0, 10) ?? null) ||
      Boolean(selectedPhoto) ||
      isPhotoRemoved
    );
  }, [
    firstName,
    isPhotoRemoved,
    lastName,
    normalizedBirthDate,
    phone,
    selectedPhoto,
    user,
  ]);

  if (!user || !token) return null;

  const profileHome =
    segments[0] === "(business)" ? "/(business)/profile" : "/(tabs)/profile";
  const hasSavedProfilePhoto = Boolean(user.profileImageUrl);
  const previewUrl =
    selectedPhoto?.uri ?? (isPhotoRemoved ? "" : user.profileImageUrl);

  async function selectPhoto() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled) return;

    const photo = result.assets[0];
    if (photo.fileSize && photo.fileSize > 5 * 1024 * 1024) {
      setError("Profil fotoğrafı en fazla 5 MB olabilir.");
      return;
    }
    setSelectedPhoto({ uri: photo.uri, mimeType: photo.mimeType });
    setIsPhotoRemoved(false);
  }

  function openPhotoMenu() {
    if (!previewUrl) {
      void selectPhoto();
      return;
    }
    Alert.alert("Profil Fotoğrafı", undefined, [
      { text: "Fotoğrafı Değiştir", onPress: () => void selectPhoto() },
      {
        text: "Fotoğrafı Kaldır",
        style: "destructive",
        onPress: () => {
          setSelectedPhoto(null);
          setIsPhotoRemoved(true);
        },
      },
      { text: "İptal", style: "cancel" },
    ]);
  }

  function openDatePicker() {
    setDraftBirthDate(inputToDate(birthDate));
    setDatePickerVisible(true);
  }

  function changeAndroidDate(event: DateTimePickerEvent, selected?: Date) {
    setDatePickerVisible(false);
    if (event.type === "set" && selected) setBirthDate(dateToInput(selected));
  }

  async function saveProfile() {
    if (!token) return;
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    if (!trimmedFirstName || !trimmedLastName) {
      setError("Ad ve soyad boş bırakılamaz.");
      return;
    }
    if (birthDate && !normalizedBirthDate) {
      setError("Geçerli bir doğum tarihi seçmelisin.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      let updatedUser = await updateMyProfile(
        {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          phone: phone.trim(),
          birthDate: normalizedBirthDate,
        },
        token,
      );
      if (selectedPhoto)
        updatedUser = await uploadMyProfilePhoto(selectedPhoto, token);
      else if (isPhotoRemoved && hasSavedProfilePhoto) {
        updatedUser = await removeMyProfilePhoto(token);
      }
      await updateUser(updatedUser);
      router.replace(profileHome);
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Profil güncellenemedi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SettingsPageHeader
            onBackPress={() => router.replace(profileHome)}
            title="Hesap Bilgileri"
          />

          <AppCard style={styles.profileHeader}>
            {previewUrl ? (
              <Image
                accessibilityLabel="Profil fotoğrafı önizlemesi"
                contentFit="cover"
                source={previewUrl}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: colors.surfaceMuted,
                    borderColor: colors.border,
                  },
                ]}
              >
                <AppText
                  color="primary"
                  style={styles.initial}
                  variant="heading"
                >
                  {firstName.slice(0, 1).toUpperCase() || "?"}
                </AppText>
              </View>
            )}
            <View style={styles.profileIdentity}>
              <AppText numberOfLines={2} variant="cardTitle">
                {`${firstName.trim()} ${lastName.trim()}`.trim() || "Profilin"}
              </AppText>
              <Pressable
                accessibilityRole="button"
                onPress={openPhotoMenu}
                style={({ pressed }) => [
                  styles.photoAction,
                  pressed && styles.pressed,
                ]}
              >
                <AppText color="primary" variant="label">
                  Fotoğrafı Değiştir
                </AppText>
              </Pressable>
            </View>
            <SymbolView
              name={{
                ios: "camera.fill",
                android: "photo_camera",
                web: "photo_camera",
              }}
              size={19}
              tintColor={colors.primary}
            />
          </AppCard>

          <ProfileSection title="Kişisel Bilgiler">
            <AppCard style={styles.formCard}>
              <CompactTextField
                autoCapitalize="words"
                icon={{ ios: "person", android: "person", web: "person" }}
                label="Ad"
                onChangeText={setFirstName}
                placeholder="Adın"
                value={firstName}
              />
              <CompactTextField
                autoCapitalize="words"
                icon={{ ios: "person", android: "person", web: "person" }}
                label="Soyad"
                onChangeText={setLastName}
                placeholder="Soyadın"
                value={lastName}
              />
              <CompactTextField
                icon={{ ios: "phone", android: "phone", web: "phone" }}
                keyboardType="phone-pad"
                label="Telefon"
                maxLength={17}
                onChangeText={(value) => setPhone(formatTurkishPhone(value))}
                placeholder="+90 5xx xxx xx xx"
                value={phone}
              />
              {Platform.OS === "web" ? (
                <CompactTextField
                  icon={{
                    ios: "calendar",
                    android: "calendar_month",
                    web: "calendar_month",
                  }}
                  keyboardType="number-pad"
                  label="Doğum Tarihi"
                  maxLength={10}
                  onChangeText={(value) =>
                    setBirthDate(formatBirthDateInput(value))
                  }
                  placeholder="GG.AA.YYYY"
                  value={birthDate}
                />
              ) : (
                <DateField
                  onClear={() => setBirthDate("")}
                  onPress={openDatePicker}
                  value={birthDate}
                />
              )}
            </AppCard>
          </ProfileSection>

          <ProfileSection title="Hesap">
            <AppCard
              accessibilityLabel={`E-posta: ${user.email}. Bu alan güvenlik nedeniyle buradan değiştirilemez.`}
              style={[
                styles.readOnlyCard,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <View
                style={[
                  styles.readOnlyIcon,
                  { backgroundColor: colors.surface },
                ]}
              >
                <SymbolView
                  name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                  size={18}
                  tintColor={colors.textMuted}
                />
              </View>
              <View style={styles.readOnlyContent}>
                <AppText variant="label">E-posta</AppText>
                <AppText color="textMuted" numberOfLines={1} selectable>
                  {user.email}
                </AppText>
                <AppText
                  color="textMuted"
                  style={styles.readOnlyHint}
                  variant="bodySmall"
                >
                  Güvenlik nedeniyle buradan değiştirilemez.
                </AppText>
              </View>
            </AppCard>
          </ProfileSection>
        </ScrollView>

        <SafeAreaView
          edges={["bottom"]}
          style={[
            styles.footer,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {error ? (
            <AppText color="danger" style={styles.error} variant="bodySmall">
              {error}
            </AppText>
          ) : null}
          <AppButton
            disabled={isSaving || !isDirty}
            onPress={() => void saveProfile()}
          >
            {isSaving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </AppButton>
        </SafeAreaView>

        {Platform.OS === "android" && isDatePickerVisible ? (
          <DateTimePicker
            maximumDate={new Date()}
            minimumDate={earliestBirthDate}
            mode="date"
            onChange={changeAndroidDate}
            value={draftBirthDate}
          />
        ) : null}

        <Modal
          animationType="fade"
          onRequestClose={() => setDatePickerVisible(false)}
          transparent
          visible={Platform.OS === "ios" && isDatePickerVisible}
        >
          <Pressable
            onPress={() => setDatePickerVisible(false)}
            style={styles.modalOverlay}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={[
                styles.datePickerCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <AppText style={styles.datePickerTitle} variant="sectionTitle">
                Doğum Tarihi
              </AppText>
              <DateTimePicker
                display="spinner"
                locale="tr-TR"
                maximumDate={new Date()}
                minimumDate={earliestBirthDate}
                mode="date"
                onChange={(_, selected) =>
                  selected && setDraftBirthDate(selected)
                }
                value={draftBirthDate}
              />
              <View style={styles.dateActions}>
                <View style={styles.dateAction}>
                  <AppButton
                    onPress={() => setDatePickerVisible(false)}
                    variant="secondary"
                  >
                    İptal
                  </AppButton>
                </View>
                <View style={styles.dateAction}>
                  <AppButton
                    onPress={() => {
                      setBirthDate(dateToInput(draftBirthDate));
                      setDatePickerVisible(false);
                    }}
                  >
                    Tarihi Kullan
                  </AppButton>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function ProfileSection({
  children,
  title,
}: PropsWithChildren<{ title: string }>) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="sectionTitle">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function CompactTextField({
  icon,
  label,
  style,
  ...props
}: TextInputProps & { icon: SymbolViewProps["name"]; label: string }) {
  const colors = useThemeColors();
  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel} variant="label">
        {label}
      </AppText>
      <View
        style={[
          styles.inputShell,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <SymbolView name={icon} size={17} tintColor={colors.textMuted} />
        <TextInput
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, { color: colors.text }, style]}
          {...props}
        />
      </View>
    </View>
  );
}

function DateField({
  onClear,
  onPress,
  value,
}: {
  onClear: () => void;
  onPress: () => void;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel} variant="label">
        Doğum Tarihi
      </AppText>
      <Pressable
        accessibilityLabel={`Doğum tarihi: ${value || "eklenmedi"}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputShell,
          { backgroundColor: colors.background, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{
            ios: "calendar",
            android: "calendar_month",
            web: "calendar_month",
          }}
          size={17}
          tintColor={colors.textMuted}
        />
        <AppText color={value ? "text" : "textMuted"} style={styles.dateValue}>
          {value || "GG.AA.YYYY"}
        </AppText>
        {value ? (
          <Pressable
            accessibilityLabel="Doğum tarihini kaldır"
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onClear();
            }}
          >
            <SymbolView
              name={{
                ios: "xmark.circle.fill",
                android: "cancel",
                web: "cancel",
              }}
              size={18}
              tintColor={colors.textMuted}
            />
          </Pressable>
        ) : (
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={17}
            tintColor={colors.textMuted}
          />
        )}
      </Pressable>
    </View>
  );
}

function formatTurkishPhone(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "";
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean);
  return `+90 ${parts.join(" ")}`;
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "").replace(/^90/, "").replace(/^0/, "");
}

function inputToDate(value: string) {
  const iso = birthDateInputToIso(value);
  if (!iso) return new Date(2000, 0, 1);
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToInput(value: Date) {
  return [
    String(value.getDate()).padStart(2, "0"),
    String(value.getMonth() + 1).padStart(2, "0"),
    value.getFullYear(),
  ].join(".");
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: layout.screenHorizontalPadding,
  },
  profileHeader: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.md,
    minHeight: 96,
    padding: spacing.md,
  },
  avatar: { borderRadius: radius.pill, height: 64, width: 64 },
  avatarPlaceholder: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  initial: { fontSize: 30, lineHeight: 36 },
  profileIdentity: { flex: 1, marginLeft: spacing.sm },
  photoAction: { marginTop: spacing.xs },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 20, lineHeight: 26, marginBottom: spacing.sm },
  formCard: { gap: 14, padding: spacing.md },
  field: { gap: spacing.xxs },
  fieldLabel: { marginLeft: spacing.xxs },
  inputShell: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dateValue: { flex: 1, marginLeft: spacing.sm },
  readOnlyCard: { alignItems: "center", flexDirection: "row", minHeight: 96 },
  readOnlyIcon: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  readOnlyContent: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  readOnlyHint: { marginTop: spacing.xxs },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.sm,
  },
  error: { marginBottom: spacing.xs, textAlign: "center" },
  pressed: { opacity: 0.68 },
  modalOverlay: {
    backgroundColor: "rgba(12, 8, 5, 0.55)",
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  datePickerCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
  datePickerTitle: { textAlign: "center" },
  dateActions: { flexDirection: "row", gap: spacing.sm },
  dateAction: { flex: 1 },
});
