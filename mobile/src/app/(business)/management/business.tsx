import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Image } from "expo-image";
import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  getPublicBarbershop,
  uploadBarbershopCoverPhoto,
  uploadBarbershopGalleryPhotos,
  uploadBarbershopProfilePhoto,
  updateBarbershopProfile,
} from "@/features/barbershops/api";
import type { UpdateBarbershopProfileInput } from "@/features/barbershops/types";
import { BusinessManagementState } from "@/features/business-management/components/BusinessManagementState";
import { BusinessProfilePreview } from "@/features/business-settings/components/BusinessProfilePreview";
import { BusinessSettingsField } from "@/features/business-settings/components/BusinessSettingsField";
import { BusinessVisibilityCard } from "@/features/business-settings/components/BusinessVisibilityCard";
import { useBusiness } from "@/features/business/BusinessProvider";
import { BusinessDetailHeader } from "@/features/business/components/BusinessDetailHeader";
import {
  BusinessLocationMapPicker,
  type BusinessCoordinate,
} from "@/features/locations/components/BusinessLocationMapPicker";
import { colors } from "@/theme/colors";
import { layout, radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type LocationMethod = "current" | "map";

function serializeProfile(profile: UpdateBarbershopProfileInput | null) {
  return profile ? JSON.stringify(profile) : "";
}

function isValidOptionalUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { refreshUser, token } = useAuth();
  const { activeMembership } = useBusiness();
  const [profile, setProfile] = useState<UpdateBarbershopProfileInput | null>(
    null,
  );
  const [savedProfile, setSavedProfile] =
    useState<UpdateBarbershopProfileInput | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isLocating, setLocating] = useState(false);
  const [locatingMethod, setLocatingMethod] =
    useState<LocationMethod | null>(null);
  const [locationMethod, setLocationMethod] =
    useState<LocationMethod | null>(null);
  const [isMapVisible, setMapVisible] = useState(false);
  const [mapInitialCoordinate, setMapInitialCoordinate] =
    useState<BusinessCoordinate>({ latitude: 39, longitude: 35 });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<
    { id: string; url: string }[]
  >([]);

  const loadProfile = useCallback(async () => {
    if (!activeMembership) return;

    setLoading(true);
    setLoadError(null);
    try {
      const barbershop = await getPublicBarbershop(
        activeMembership.barbershop.slug,
      );
      const nextProfile: UpdateBarbershopProfileInput = {
        address: barbershop.address ?? "",
        coverImageUrl: barbershop.coverImageUrl ?? "",
        description: barbershop.description ?? "",
        isDiscoverable: barbershop.isDiscoverable,
        latitude: barbershop.latitude,
        longitude: barbershop.longitude,
        name: barbershop.name,
        phone: barbershop.phone ?? "",
        profileImageUrl: barbershop.profileImageUrl ?? "",
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      setLocationMethod(null);
      setGalleryPhotos(barbershop.galleryPhotos);
    } catch (reason) {
      setLoadError(
        reason instanceof Error
          ? reason.message
          : "İşletme bilgileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeMembership]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const hasChanges =
    serializeProfile(profile) !== serializeProfile(savedProfile);

  if (!activeMembership) return null;

  function updateProfile(updates: Partial<UpdateBarbershopProfileInput>) {
    setProfile((current) => (current ? { ...current, ...updates } : current));
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleBack() {
    if (!hasChanges) {
      leaveBusinessSettings();
      return;
    }

    Alert.alert(
      "Kaydedilmemiş değişiklikler",
      "İşletme bilgilerinde yaptığın değişiklikler kaybolacak.",
      [
        { text: "Düzenlemeye Devam Et", style: "cancel" },
        {
          text: "Değişiklikleri Sil",
          style: "destructive",
          onPress: leaveBusinessSettings,
        },
      ],
    );
  }

  function leaveBusinessSettings() {
    if (source === "profile") {
      router.replace("/(business)/profile");
      return;
    }

    router.dismissTo("/management");
  }

  async function handleSave() {
    if (!profile || !token || !activeMembership) return;

    const normalizedProfile = {
      ...profile,
      address: profile.address.trim(),
      coverImageUrl: profile.coverImageUrl.trim(),
      description: profile.description.trim(),
      name: profile.name.trim(),
      phone: profile.phone.trim(),
      profileImageUrl: profile.profileImageUrl.trim(),
    };

    if (normalizedProfile.name.length < 2) {
      setSubmitError("İşletme adı en az 2 karakter olmalı.");
      return;
    }
    if (!normalizedProfile.address) {
      setSubmitError(
        "Müşterilerin işletmeyi bulabilmesi için adres zorunludur.",
      );
      return;
    }
    if (!isValidOptionalUrl(normalizedProfile.profileImageUrl)) {
      setSubmitError(
        "Profil fotoğrafı için geçerli bir HTTPS bağlantısı kullanmalısın.",
      );
      return;
    }
    if (!isValidOptionalUrl(normalizedProfile.coverImageUrl)) {
      setSubmitError(
        "Kapak fotoğrafı için geçerli bir HTTPS bağlantısı kullanmalısın.",
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const saved = await updateBarbershopProfile(
        activeMembership.barbershop.id,
        normalizedProfile,
        token,
      );
      const nextProfile: UpdateBarbershopProfileInput = {
        address: saved.address ?? "",
        coverImageUrl: saved.coverImageUrl ?? "",
        description: saved.description ?? "",
      isDiscoverable: saved.isDiscoverable,
        latitude: saved.latitude,
        longitude: saved.longitude,
        name: saved.name,
        phone: saved.phone ?? "",
        profileImageUrl: saved.profileImageUrl ?? "",
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      await refreshUser();
      setSuccessMessage(
        "İşletme bilgileri kaydedildi. Müşteri profili de güncellendi.",
      );
    } catch (reason) {
      setSubmitError(
        reason instanceof Error
          ? reason.message
          : "İşletme bilgileri kaydedilemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function chooseBusinessPhotos(kind: "profile" | "cover" | "gallery") {
    if (!token || !activeMembership) return;
    const result = await ImagePicker.launchImageLibraryAsync(
      kind !== "gallery"
        ? {
            allowsEditing: true,
            aspect: [1, 1],
            mediaTypes: ["images"],
            quality: 0.85,
          }
        : {
            allowsEditing: true,
            aspect: [4, 3],
            mediaTypes: ["images"],
            quality: 0.85,
          },
    );
    if (result.canceled) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const photos = result.assets.map((asset) => ({
        uri: asset.uri,
        mimeType: asset.mimeType,
      }));
      if (
        photos.some(
          (photo) =>
            photo.mimeType !== "image/jpeg" &&
            photo.mimeType !== "image/png" &&
            photo.mimeType !== "image/webp",
        )
      ) {
        setSubmitError(
          "JPEG, PNG veya WebP formatında bir fotoğraf seçmelisin.",
        );
        return;
      }
      if (kind === "profile") {
        await uploadBarbershopProfilePhoto(
          activeMembership.barbershop.id,
          photos[0],
          token,
        );
      } else if (kind === "cover") {
        await uploadBarbershopCoverPhoto(
          activeMembership.barbershop.id,
          photos[0],
          token,
        );
      } else {
        await uploadBarbershopGalleryPhotos(
          activeMembership.barbershop.id,
          photos,
          token,
        );
      }
      await loadProfile();
      await refreshUser();
      setSuccessMessage(
        kind === "profile"
          ? "İşletme profil fotoğrafı güncellendi."
          : kind === "cover"
            ? "Kapak fotoğrafı güncellendi."
            : "Galeri fotoğrafları eklendi.",
      );
    } catch (reason) {
      setSubmitError(
        reason instanceof Error ? reason.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openMapPicker() {
    if (!profile) return;

    setLocating(true);
    setLocatingMethod("map");
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      if (profile.latitude !== null && profile.longitude !== null) {
        setMapInitialCoordinate({
          latitude: profile.latitude,
          longitude: profile.longitude,
        });
      } else {
        if (!profile.address.trim()) {
          setSubmitError("Haritayı açmadan önce işletme adresini girmelisin.");
          return;
        }
        if (Platform.OS === "android") {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (!permission.granted) {
            setSubmitError("Haritayı adrese götürmek için konum izni vermelisin.");
            return;
          }
        }
        const result = (await Location.geocodeAsync(profile.address.trim()))[0];
        if (!result) {
          setSubmitError(
            "Adres haritada bulunamadı. Adresi kontrol edip tekrar dene.",
          );
          return;
        }
        setMapInitialCoordinate({
          latitude: result.latitude,
          longitude: result.longitude,
        });
      }
      setMapVisible(true);
    } catch {
      setSubmitError("Harita açılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setLocating(false);
      setLocatingMethod(null);
    }
  }

  async function captureBusinessLocation() {
    setLocating(true);
    setLocatingMethod("current");
    setSubmitError(null);
    setSuccessMessage(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setSubmitError("İşletme konumunu kaydetmek için konum izni vermelisin.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      updateProfile({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationMethod("current");
      setSuccessMessage(
        "Mevcut konum alındı. Kaydet düğmesine basmayı unutma.",
      );
    } catch {
      setSubmitError("Konum alınamadı. Cihaz konumunu kontrol edip tekrar dene.");
    } finally {
      setLocating(false);
      setLocatingMethod(null);
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
          <BusinessDetailHeader onBack={handleBack} title="İşletme Ayarları" />
          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {!isLoading && loadError ? (
            <BusinessManagementState
              description={loadError}
              onRetry={() => void loadProfile()}
              title="İşletme bilgileri yüklenemedi"
            />
          ) : null}

          {!isLoading && !loadError && profile ? (
            <>
              <BusinessProfilePreview
                address={profile.address}
                coverImageUrl={profile.coverImageUrl}
                isDiscoverable={profile.isDiscoverable}
                name={profile.name}
                onPressCoverImage={() => void chooseBusinessPhotos("cover")}
                onPressProfileImage={() => void chooseBusinessPhotos("profile")}
                profileImageUrl={profile.profileImageUrl}
              />

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="sectionTitle">
                  Profil bilgileri
                </AppText>
              </View>
              <AppCard style={styles.formCard}>
                <BusinessSettingsField
                  autoCapitalize="words"
                  icon={{
                    ios: "storefront",
                    android: "storefront",
                    web: "storefront",
                  }}
                  label="İşletme adı"
                  maxLength={100}
                  onChangeText={(value) => updateProfile({ name: value })}
                  placeholder="İşletme adı"
                  value={profile.name}
                />
                <BusinessSettingsField
                  icon={{
                    ios: "text.alignleft",
                    android: "notes",
                    web: "notes",
                  }}
                  label="Açıklama"
                  maxLength={1000}
                  multiline
                  onChangeText={(value) =>
                    updateProfile({ description: value })
                  }
                  placeholder="İşletmeni ve sunduğun deneyimi anlat"
                  value={profile.description}
                />
              </AppCard>

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="sectionTitle">
                  İletişim ve konum
                </AppText>
              </View>
              <AppCard style={styles.formCard}>
                <BusinessSettingsField
                  icon={{ ios: "phone", android: "phone", web: "phone" }}
                  keyboardType="phone-pad"
                  label="Telefon"
                  maxLength={30}
                  onChangeText={(value) => updateProfile({ phone: value })}
                  placeholder="+90 5xx xxx xx xx"
                  value={profile.phone}
                />
                <BusinessSettingsField
                  autoCapitalize="words"
                  icon={{
                    ios: "mappin.and.ellipse",
                    android: "location_on",
                    web: "location_on",
                  }}
                  label="Adres"
                  maxLength={500}
                  multiline
                  onChangeText={(value) => {
                    updateProfile({
                      address: value,
                      latitude: null,
                      longitude: null,
                    });
                    setLocationMethod(null);
                  }}
                  placeholder="Mahalle, sokak, ilçe ve şehir"
                  value={profile.address}
                />
                <View style={styles.locationAction}>
                  <AppText style={styles.locationChoiceTitle} variant="label">
                    İşletme konumunu nasıl işaretleyelim?
                  </AppText>
                  <LocationMethodCard
                    disabled={isLocating || isSubmitting}
                    icon={{ ios: "map.fill", android: "map", web: "map" }}
                    onPress={() => void openMapPicker()}
                    selected={locationMethod === "map"}
                    subtitle="Haritayı açıp işletmenin bulunduğu noktayı seç."
                    title={
                      locatingMethod === "map"
                        ? "Harita hazırlanıyor…"
                        : "Haritadan konum seç"
                    }
                  />
                  <LocationMethodCard
                    disabled={isLocating || isSubmitting}
                    icon={{
                      ios: "location.fill",
                      android: "my_location",
                      web: "my_location",
                    }}
                    onPress={() => void captureBusinessLocation()}
                    selected={locationMethod === "current"}
                    subtitle="Şu anda işletmedeysen cihazının konumunu kullan."
                    title={
                      locatingMethod === "current"
                        ? "Mevcut konum alınıyor…"
                        : "Mevcut konumumu kullan"
                    }
                  />
                  {profile.latitude !== null && profile.longitude !== null ? (
                    <View style={styles.coordinateStatus}>
                      <SymbolView
                        name={{
                          ios: "checkmark.circle.fill",
                          android: "check_circle",
                          web: "check_circle",
                        }}
                        size={18}
                        tintColor={colors.success}
                      />
                      <AppText
                        color="success"
                        style={styles.coordinateText}
                        variant="bodySmall"
                      >
                        {locationMethod === "current"
                          ? "Mevcut GPS konumu kaydedilmeye hazır."
                          : locationMethod === "map"
                            ? "Haritada seçtiğin konum kaydedilmeye hazır."
                            : "Kayıtlı işletme konumu kullanılacak."}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </AppCard>

              <BusinessLocationMapPicker
                initialCoordinate={mapInitialCoordinate}
                initiallyConfirmed={
                  profile.latitude !== null && profile.longitude !== null
                }
                key={`${isMapVisible}-${mapInitialCoordinate.latitude}-${mapInitialCoordinate.longitude}`}
                onClose={() => setMapVisible(false)}
                onConfirm={(coordinate) => {
                  updateProfile(coordinate);
                  setLocationMethod("map");
                  setMapVisible(false);
                  setSuccessMessage(
                    "Haritadaki konum seçildi. Kaydet düğmesine basmayı unutma.",
                  );
                }}
                visible={isMapVisible}
              />

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="sectionTitle">
                  Galeri
                </AppText>
              </View>
              <AppCard style={styles.formCard}>
                <View style={styles.galleryHeading}>
                  <AppText color="textMuted" variant="bodySmall">
                    {galleryPhotos.length} fotoğraf
                  </AppText>
                  {galleryPhotos.length ? (
                    <Pressable
                      accessibilityLabel="İşletme galerisinin tümünü gör"
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({
                          pathname: "/barbers/[slug]/gallery",
                          params: { slug: activeMembership.barbershop.slug },
                        })
                      }
                      style={({ pressed }) => [
                        styles.allGalleryButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText color="primary" variant="label">Tümünü Gör</AppText>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView
                  contentContainerStyle={styles.mediaGrid}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                >
                  {galleryPhotos.map((photo) => (
                    <Pressable
                      accessibilityLabel="İşletme galeri fotoğrafı"
                      disabled={isSubmitting}
                      key={photo.id}
                      onPress={() => void chooseBusinessPhotos("gallery")}
                      style={({ pressed }) => [
                        styles.galleryMediaCard,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Image
                        contentFit="cover"
                        source={photo.url}
                        style={styles.mediaFill}
                      />
                    </Pressable>
                  ))}
                  <Pressable
                    accessibilityLabel="İşletme galerisine fotoğraf ekle"
                    disabled={isSubmitting}
                    onPress={() => void chooseBusinessPhotos("gallery")}
                    style={({ pressed }) => [
                      styles.galleryMediaCard,
                      styles.addGalleryTile,
                      pressed && styles.pressed,
                    ]}
                  >
                    <SymbolView
                      name={{ ios: "plus", android: "add", web: "add" }}
                      size={26}
                      tintColor={colors.primary}
                    />
                  </Pressable>
                </ScrollView>
                <Pressable
                  accessibilityLabel="Galeriye yeni fotoğraf ekle"
                  disabled={isSubmitting}
                  onPress={() => void chooseBusinessPhotos("gallery")}
                  style={({ pressed }) => [
                    styles.addMediaButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <SymbolView
                    name={{ ios: "plus", android: "add", web: "add" }}
                    size={20}
                    tintColor={colors.primary}
                  />
                  <AppText color="primary" variant="label">
                    Galeriye fotoğraf ekle
                  </AppText>
                </Pressable>
              </AppCard>

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="sectionTitle">
                  Görünürlük
                </AppText>
              </View>
              <BusinessVisibilityCard
                onChange={(value) => updateProfile({ isDiscoverable: value })}
                value={profile.isDiscoverable}
              />

              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: "/management/access",
                    params: {
                      returnTo: "business",
                      ...(source === "profile" ? { source } : {}),
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.accessCard,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.identityIcon}>
                  <SymbolView
                    name={{ ios: "key", android: "key", web: "key" }}
                    size={21}
                    tintColor={colors.primary}
                  />
                </View>
                <View style={styles.identityCopy}>
                  <AppText variant="label">Randevu erişimi</AppText>
                  <AppText
                    color="textMuted"
                    style={styles.timezone}
                    variant="bodySmall"
                  >
                    Herkese açık veya yalnızca özel kodla randevu
                  </AppText>
                </View>
                <SymbolView
                  name={{
                    ios: "chevron.right",
                    android: "chevron_right",
                    web: "chevron_right",
                  }}
                  size={18}
                  tintColor={colors.textMuted}
                />
              </Pressable>

              <View style={styles.identityCard}>
                <View style={styles.identityIcon}>
                  <SymbolView
                    name={{ ios: "link", android: "link", web: "link" }}
                    size={20}
                    tintColor={colors.primary}
                  />
                </View>
                <View style={styles.identityCopy}>
                  <AppText variant="label">Kalıcı işletme bağlantısı</AppText>
                  <AppText color="textMuted" variant="bodySmall">
                    trimly.app/barber/{activeMembership.barbershop.slug}
                  </AppText>
                  <AppText
                    color="textMuted"
                    style={styles.timezone}
                    variant="bodySmall"
                  >
                    Saat dilimi: {activeMembership.barbershop.timezone}
                  </AppText>
                </View>
              </View>

              {submitError ? (
                <View style={[styles.message, styles.errorMessage]}>
                  <AppText color="danger" variant="bodySmall">
                    {submitError}
                  </AppText>
                </View>
              ) : null}

              {successMessage ? (
                <View style={[styles.message, styles.successMessage]}>
                  <AppText style={styles.successText} variant="bodySmall">
                    {successMessage}
                  </AppText>
                </View>
              ) : null}

              <AppButton
                disabled={isSubmitting || !hasChanges}
                onPress={() => void handleSave()}
              >
                {isSubmitting
                  ? "Kaydediliyor..."
                  : hasChanges
                    ? "İşletmeyi Kaydet"
                    : "Değişiklik Yok"}
              </AppButton>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function LocationMethodCard({
  disabled,
  icon,
  onPress,
  selected,
  subtitle,
  title,
}: {
  disabled: boolean;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  selected: boolean;
  subtitle: string;
  title: string;
}) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.locationMethod,
        {
          backgroundColor: selected
            ? themeColors.successSurface
            : themeColors.background,
          borderColor: selected ? themeColors.success : themeColors.border,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.locationMethodIcon,
          { backgroundColor: themeColors.surfaceMuted },
        ]}
      >
        <SymbolView
          name={icon}
          size={21}
          tintColor={selected ? themeColors.success : themeColors.primary}
        />
      </View>
      <View style={styles.locationMethodCopy}>
        <AppText style={styles.locationMethodTitle} variant="label">
          {title}
        </AppText>
        <AppText
          color="textMuted"
          style={styles.locationMethodSubtitle}
          variant="bodySmall"
        >
          {subtitle}
        </AppText>
      </View>
      <SymbolView
        name={{
          ios: selected ? "checkmark.circle.fill" : "chevron.right",
          android: selected ? "check_circle" : "chevron_right",
          web: selected ? "check_circle" : "chevron_right",
        }}
        size={20}
        tintColor={selected ? themeColors.success : themeColors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
  sectionHeading: { marginBottom: spacing.sm, marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  formCard: { paddingBottom: spacing.sm, paddingTop: 0 },
  locationAction: { gap: spacing.sm, marginTop: spacing.md },
  locationChoiceTitle: { marginBottom: spacing.xxs },
  locationMethod: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 74,
    padding: spacing.sm,
  },
  locationMethodIcon: {
    alignItems: "center",
    borderRadius: radius.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  locationMethodCopy: { flex: 1, marginHorizontal: spacing.sm },
  locationMethodTitle: { lineHeight: 20 },
  locationMethodSubtitle: { lineHeight: 18, marginTop: 2 },
  coordinateStatus: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
  },
  coordinateText: { flex: 1, marginLeft: spacing.xs },
  galleryHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  allGalleryButton: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xs },
  mediaGrid: { gap: spacing.sm, paddingVertical: spacing.sm },
  galleryMediaCard: {
    borderRadius: radius.smallCard,
    height: 96,
    overflow: "hidden",
    width: 132,
  },
  mediaFill: { height: "100%", width: "100%" },
  mediaPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
  },
  addGalleryTile: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
  },
  addMediaButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radius.smallCard,
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.sm,
    minHeight: 48,
  },
  identityCard: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.card,
    flexDirection: "row",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  accessCard: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  identityIcon: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  identityCopy: { flex: 1, marginLeft: spacing.sm },
  timezone: { marginTop: 2 },
  message: {
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  errorMessage: { backgroundColor: "#F8E7E3" },
  successMessage: { backgroundColor: "#E8F1E5" },
  successText: { color: "#4F7653" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.68 },
});
