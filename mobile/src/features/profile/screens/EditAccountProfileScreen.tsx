import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter, useSegments } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import {
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
import { UnsavedChangesSheet } from "@/components/ui/UnsavedChangesSheet";
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
import {
  LocationSelectField,
  type LocationOption,
} from "@/features/locations/components/LocationSelectField";
import {
  getDistricts,
  getNeighborhoods,
  getProvinces,
} from "@/features/locations/api";
import { goBackOrReplace } from "@/lib/navigation/goBackOrReplace";
import { layout, radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

const earliestBirthDate = new Date(1900, 0, 1);

export function EditAccountProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const segments = useSegments();
  const colors = useThemeColors();
  const { token, updateUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(formatTurkishPhone(user?.phone ?? ""));
  const [birthDate, setBirthDate] = useState(
    birthDateToInput(user?.birthDate ?? null),
  );
  const [province, setProvince] = useState<LocationOption | null>(
    user?.provinceCode && user.province
      ? { label: user.province, value: user.provinceCode }
      : null,
  );
  const [district, setDistrict] = useState<LocationOption | null>(
    user?.district ? { label: user.district, value: user.district } : null,
  );
  const [neighborhood, setNeighborhood] = useState<LocationOption | null>(
    user?.neighborhood
      ? { label: user.neighborhood, value: user.neighborhood }
      : null,
  );
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationOption[]>([]);
  const [isLoadingProvinces, setLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setLoadingDistricts] = useState(false);
  const [isLoadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
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
  const [isPhotoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [isUnsavedChangesVisible, setUnsavedChangesVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const allowNavigation = useRef(false);
  const openPhotoPickerAfterDismiss = useRef(false);

  const normalizedBirthDate = birthDate ? birthDateInputToIso(birthDate) : null;
  const isDirty = useMemo(() => {
    if (!user) return false;
    return (
      firstName.trim() !== user.firstName ||
      lastName.trim() !== user.lastName ||
      phoneDigits(phone) !== phoneDigits(user.phone ?? "") ||
      normalizedBirthDate !== (user.birthDate?.slice(0, 10) ?? null) ||
      (province?.value ?? null) !== user.provinceCode ||
      (district?.label ?? null) !== user.district ||
      (neighborhood?.label ?? null) !== user.neighborhood ||
      Boolean(selectedPhoto) ||
      isPhotoRemoved
    );
  }, [
    firstName,
    isPhotoRemoved,
    lastName,
    normalizedBirthDate,
    province,
    district,
    neighborhood,
    phone,
    selectedPhoto,
    user,
  ]);

  useEffect(() => {
    let isActive = true;
    async function loadLocations() {
      try {
        const provinceItems = await getProvinces();
        if (!isActive) return;
        setProvinces(provinceItems.map((item) => ({ label: item.name, value: item.code })));
        if (!user?.provinceCode) return;

        setLoadingDistricts(true);
        const districtItems = await getDistricts(user.provinceCode);
        if (!isActive) return;
        setDistricts(districtItems.map((item) => ({ label: item, value: item })));
        if (!user.district) return;

        setLoadingNeighborhoods(true);
        const neighborhoodItems = await getNeighborhoods(user.provinceCode, user.district);
        if (isActive) {
          setNeighborhoods(neighborhoodItems.map((item) => ({ label: item, value: item })));
        }
      } catch {
        if (isActive) setError("Konum seçenekleri yüklenemedi. Lütfen tekrar dene.");
      } finally {
        if (isActive) {
          setLoadingProvinces(false);
          setLoadingDistricts(false);
          setLoadingNeighborhoods(false);
        }
      }
    }
    void loadLocations();
    return () => { isActive = false; };
  }, [user?.district, user?.provinceCode]);

  useEffect(
    () => navigation.addListener("beforeRemove", (event) => {
      if (!isDirty || allowNavigation.current) return;
      event.preventDefault();
      setUnsavedChangesVisible(true);
    }),
    [isDirty, navigation],
  );

  if (!user || !token) return null;

  const isBusinessProfile = segments[0] === "(business)";
  const profileHome = isBusinessProfile ? "/(business)/profile" : "/(tabs)/profile";
  const returnRoute = returnTo === "business-settings"
    ? "/(business)/profile/settings"
    : returnTo === "customer-settings"
      ? "/(tabs)/profile/settings"
      : profileHome;
  const leaveScreen = () => goBackOrReplace(router, returnRoute);
  const requestBack = () => {
    if (isDirty) setUnsavedChangesVisible(true);
    else leaveScreen();
  };
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
    setPhotoMenuVisible(true);
  }

  function changePhotoFromMenu() {
    setPhotoMenuVisible(false);
    if (Platform.OS === "ios") {
      openPhotoPickerAfterDismiss.current = true;
    } else {
      void selectPhoto();
    }
  }

  function removePhotoFromMenu() {
    setSelectedPhoto(null);
    setIsPhotoRemoved(true);
    setPhotoMenuVisible(false);
  }

  function openDatePicker() {
    setDraftBirthDate(inputToDate(birthDate));
    setDatePickerVisible(true);
  }

  function changeAndroidDate(event: DateTimePickerEvent, selected?: Date) {
    setDatePickerVisible(false);
    if (event.type === "set" && selected) setBirthDate(dateToInput(selected));
  }

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
    if ((province && !district) || (!province && district)) {
      setError("Konum için il ve ilçe seçmelisin.");
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
          provinceCode: province?.value ?? null,
          province: province?.label ?? null,
          district: district?.label ?? null,
          neighborhood: neighborhood?.label ?? null,
        },
        token,
      );
      if (selectedPhoto)
        updatedUser = await uploadMyProfilePhoto(selectedPhoto, token);
      else if (isPhotoRemoved && hasSavedProfilePhoto) {
        updatedUser = await removeMyProfilePhoto(token);
      }
      await updateUser(updatedUser);
      setUnsavedChangesVisible(false);
      allowNavigation.current = true;
      leaveScreen();
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
            onBackPress={requestBack}
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
            </View>
            <Pressable
              accessibilityLabel="Profil fotoğrafını değiştir"
              accessibilityRole="button"
              onPress={openPhotoMenu}
              style={({ pressed }) => [styles.photoMenuButton, { backgroundColor: colors.background }, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: "photo", android: "photo_camera", web: "photo_camera" }}
                size={19}
                tintColor={colors.primary}
              />
            </Pressable>
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

          <ProfileSection title="Konum">
            <AppCard style={styles.formCard}>
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
                placeholder="İlçe seç"
                value={district}
              />
              <LocationSelectField
                disabled={!district}
                label="Mahalle"
                loading={isLoadingNeighborhoods}
                onChange={setNeighborhood}
                options={neighborhoods}
                placeholder="Mahalle seç (isteğe bağlı)"
                value={neighborhood}
              />
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
          onDismiss={() => {
            if (!openPhotoPickerAfterDismiss.current) return;
            openPhotoPickerAfterDismiss.current = false;
            void selectPhoto();
          }}
          onRequestClose={() => setPhotoMenuVisible(false)}
          statusBarTranslucent
          transparent
          visible={isPhotoMenuVisible}
        >
          <Pressable
            accessibilityLabel="Fotoğraf seçeneklerini kapat"
            onPress={() => setPhotoMenuVisible(false)}
            style={styles.photoModalOverlay}
          >
            <Pressable
              onPress={(event) => event.stopPropagation()}
              style={[
                styles.photoMenuCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={[styles.photoMenuIcon, { backgroundColor: colors.surfaceMuted }]}>
                <SymbolView
                  name={{ ios: "photo", android: "photo_camera", web: "photo_camera" }}
                  size={25}
                  tintColor={colors.primary}
                />
              </View>
              <AppText style={styles.photoMenuTitle} variant="sectionTitle">
                Profil Fotoğrafı
              </AppText>
              <AppText color="textMuted" style={styles.photoMenuDescription} variant="bodySmall">
                Fotoğrafını değiştirebilir veya profilinden kaldırabilirsin.
              </AppText>
              <View style={styles.photoMenuActions}>
                <AppButton onPress={changePhotoFromMenu}>Fotoğrafı Değiştir</AppButton>
                <Pressable
                  accessibilityRole="button"
                  onPress={removePhotoFromMenu}
                  style={({ pressed }) => [
                    styles.removePhotoButton,
                    { backgroundColor: colors.dangerSurface, borderColor: colors.danger },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText color="danger" variant="label">Fotoğrafı Kaldır</AppText>
                </Pressable>
                <AppButton onPress={() => setPhotoMenuVisible(false)} variant="secondary">
                  Vazgeç
                </AppButton>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

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
      <UnsavedChangesSheet
        description="Hesap bilgilerinde yaptığın değişiklikler henüz kaydedilmedi."
        isSaving={isSaving}
        onContinue={() => setUnsavedChangesVisible(false)}
        onDiscard={() => {
          setUnsavedChangesVisible(false);
          allowNavigation.current = true;
          leaveScreen();
        }}
        onSave={() => void saveProfile()}
        visible={isUnsavedChangesVisible}
      />
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
    justifyContent: "center",
    marginTop: spacing.md,
    minHeight: 96,
    padding: spacing.md,
  },
  avatar: { borderRadius: radius.pill, height: 64, left: spacing.md, position: "absolute", width: 64 },
  avatarPlaceholder: {
    alignItems: "center",
    borderWidth: 1,
    justifyContent: "center",
  },
  initial: { fontSize: 30, lineHeight: 36 },
  profileIdentity: { maxWidth: "58%" },
  photoMenuButton: { alignItems: "center", borderRadius: radius.pill, height: 40, justifyContent: "center", position: "absolute", right: spacing.md, width: 40 },
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
  photoModalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(12, 8, 5, 0.64)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  photoMenuCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    maxWidth: 420,
    padding: spacing.lg,
    width: "100%",
  },
  photoMenuIcon: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: radius.pill,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  photoMenuTitle: { marginTop: spacing.md, textAlign: "center" },
  photoMenuDescription: { lineHeight: 20, marginTop: spacing.xs, textAlign: "center" },
  photoMenuActions: { gap: spacing.xs, marginTop: spacing.lg },
  removePhotoButton: {
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 50,
  },
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
