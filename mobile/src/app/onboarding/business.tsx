import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { useAuth } from "@/features/auth/AuthProvider";
import { useAppMode } from "@/features/app-mode/AppModeProvider";
import { AuthScreenLayout } from "@/features/auth/components/AuthScreenLayout";
import { AuthTextField } from "@/features/auth/components/AuthTextField";
import {
  createBarbershopWithPhotos,
  getBarbershopSlugAvailability,
} from "@/features/barbershops/api";
import {
  LocationSelectField,
  type LocationOption,
} from "@/features/locations/components/LocationSelectField";
import { BusinessLocationMapPicker } from "@/features/locations/components/BusinessLocationMapPicker";
import {
  getDistricts,
  getNeighborhoods,
  getProvinces,
} from "@/features/locations/api";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type Photo = { uri: string; mimeType?: string | null };
type SlugStatus = "idle" | "checking" | "available" | "taken" | "error";
type Coordinate = { latitude: number; longitude: number };
type LocationMethod = "map" | "current";

const steps = ["İşletme", "Konum", "Görseller", "Önizleme"] as const;
const stepTitles = [
  "İşletmeni tanıtalım.",
  "Doğru konumu ekle.",
  "İşletmeni göster.",
  "Son kez kontrol et.",
];
const stepDescriptions = [
  "Müşterilerin göreceği temel işletme bilgilerini gir.",
  "İl, ilçe ve mahalleyi seç; açık adresini haritada doğrula.",
  "Kaliteli bir profil fotoğrafı ve galeri görselleri ekle.",
  "İşletme profilini yayınlamadan önce bilgilerini gözden geçir.",
];

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { refreshUser, token } = useAuth();
  const { enterBusinessMode } = useAppMode();
  const [step, setStep] = useState(0);
  const [createdBarbershopId, setCreatedBarbershopId] = useState<string | null>(null);
  const [createdMembershipId, setCreatedMembershipId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [isSlugEdited, setSlugEdited] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  const [province, setProvince] = useState<LocationOption | null>(null);
  const [district, setDistrict] = useState<LocationOption | null>(null);
  const [neighborhood, setNeighborhood] = useState<LocationOption | null>(null);
  const [openAddress, setOpenAddress] = useState("");
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<LocationOption[]>([]);
  const [isLoadingProvinces, setLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setLoadingDistricts] = useState(false);
  const [isLoadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  const [businessLocation, setBusinessLocation] = useState<Coordinate | null>(null);
  const [locationMethod, setLocationMethod] = useState<LocationMethod | null>(null);
  const [isLocating, setLocating] = useState(false);
  const [locatingMethod, setLocatingMethod] = useState<LocationMethod | null>(null);
  const [isMapVisible, setMapVisible] = useState(false);
  const [mapInitialCoordinate, setMapInitialCoordinate] = useState<Coordinate>({
    latitude: 39.0,
    longitude: 35.0,
  });

  const [profilePhoto, setProfilePhoto] = useState<Photo | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<Photo[]>([]);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const normalizedPhone = normalizeTurkishPhone(phone);
  const fullAddress = useMemo(
    () =>
      [openAddress.trim(), neighborhood?.label, district?.label, province?.label]
        .filter(Boolean)
        .join(", "),
    [district, neighborhood, openAddress, province],
  );
  const isSlugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const canContinue =
    step === 0
      ? name.trim().length >= 2 &&
        Boolean(normalizedPhone) &&
        isSlugValid &&
        slugStatus === "available"
      : step === 1
        ? Boolean(
            province &&
              district &&
              neighborhood &&
              openAddress.trim().length >= 5 &&
              businessLocation,
          )
        : step === 2
          ? Boolean(profilePhoto && galleryPhotos.length >= 2)
          : true;

  useEffect(() => {
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
        if (isActive) setError("İl listesi alınamadı. Bağlantını kontrol et.");
      })
      .finally(() => {
        if (isActive) setLoadingProvinces(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isSlugValid) return;
    let isActive = true;
    const timer = setTimeout(() => {
      setSlugStatus("checking");
      getBarbershopSlugAvailability(slug)
        .then(({ available }) => {
          if (isActive) setSlugStatus(available ? "available" : "taken");
        })
        .catch(() => {
          if (isActive) setSlugStatus("error");
        });
    }, 450);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [isSlugValid, slug]);

  function goBack() {
    if (step > 0) {
      setError(null);
      setStep((current) => current - 1);
      return;
    }
    if (source === "profile" || source === "business-select" || source === "profiles") {
      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.replace(
        source === "profile"
          ? "/(tabs)/profile"
          : source === "profiles"
            ? "/profiles"
            : "/business/select",
      );
      return;
    }
    router.replace("/(tabs)");
  }

  function changeName(value: string) {
    setName(value);
    if (!isSlugEdited) {
      setSlugStatus("idle");
      setSlug(createSlug(value));
    }
  }

  async function selectProvince(option: LocationOption) {
    setProvince(option);
    setDistrict(null);
    setNeighborhood(null);
    setDistricts([]);
    setNeighborhoods([]);
    setBusinessLocation(null);
    setLocationMethod(null);
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
    setBusinessLocation(null);
    setLocationMethod(null);
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

  async function openMapPicker() {
    setLocating(true);
    setLocatingMethod("map");
    setError(null);
    try {
      if (businessLocation) {
        setMapInitialCoordinate(businessLocation);
      }
      setMapVisible(true);
    } catch {
      setError("Harita açılamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setLocating(false);
      setLocatingMethod(null);
    }
  }

  async function captureCurrentBusinessLocation() {
    setLocating(true);
    setLocatingMethod("current");
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Mevcut konumu kullanmak için konum izni vermelisin.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setBusinessLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setLocationMethod("current");
    } catch {
      setError("Mevcut konum alınamadı. Cihaz konumunu kontrol edip tekrar dene.");
    } finally {
      setLocating(false);
      setLocatingMethod(null);
    }
  }

  async function pickProfilePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
      quality: 0.85,
    });
    if (result.canceled) return;
    const photo = result.assets[0];
    if (photo.fileSize && photo.fileSize > 5 * 1024 * 1024) {
      setError("Profil fotoğrafı en fazla 5 MB olabilir.");
      return;
    }
    setError(null);
    setProfilePhoto({ uri: photo.uri, mimeType: photo.mimeType });
  }

  async function pickGalleryPhotos() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ["images"],
      preferredAssetRepresentationMode:
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Automatic,
      quality: 0.85,
      selectionLimit: Math.max(1, 8 - galleryPhotos.length),
    });
    if (result.canceled) return;
    if (result.assets.some((photo) => photo.fileSize && photo.fileSize > 5 * 1024 * 1024)) {
      setError("Galeri fotoğraflarının her biri en fazla 5 MB olabilir.");
      return;
    }
    const selected = result.assets.map((photo) => ({
      uri: photo.uri,
      mimeType: photo.mimeType,
    }));
    setError(null);
    setGalleryPhotos((current) =>
      [...current, ...selected]
        .filter(
          (photo, index, all) =>
            all.findIndex((candidate) => candidate.uri === photo.uri) === index,
        )
        .slice(0, 8),
    );
  }

  function continueToNextStep() {
    if (!canContinue) {
      setError(stepError(step, slugStatus));
      return;
    }
    setError(null);
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit() {
    if (!token || !profilePhoto || !businessLocation || !normalizedPhone) return;
    try {
      setSubmitting(true);
      setError(null);
      const created = await createBarbershopWithPhotos(
        {
          name: name.trim(),
          slug,
          address: fullAddress,
          phone: normalizedPhone,
          latitude: businessLocation.latitude,
          longitude: businessLocation.longitude,
        },
        profilePhoto,
        galleryPhotos,
        token,
      );
      const refreshedUser = await refreshUser();
      setCreatedMembershipId(
        refreshedUser?.businessMemberships.find(
          (membership) => membership.barbershop.id === created.id,
        )?.id ?? null,
      );
      setCreatedBarbershopId(created.id);
      setCreatedName(created.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "İşletme oluşturulamadı.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openBusinessSetup() {
    try {
      setError(null);
      const refreshedUser = await refreshUser();
      const membershipId = createdMembershipId ?? refreshedUser?.businessMemberships.find(
        (membership) => membership.barbershop.id === createdBarbershopId,
      )?.id;
      if (!membershipId) {
        setError('Yeni işletme profili hazırlanıyor. Lütfen tekrar dene.');
        return;
      }
      await enterBusinessMode(membershipId);
      router.replace('/(business)/management');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kurulum ekranı açılamadı.');
    }
  }

  if (createdName) {
    return (
      <AuthScreenLayout description="İşletme profilin ve sahiplik kaydın başarıyla oluşturuldu." title="İşletmen hazır.">
        <AppCard style={styles.successCard}>
          <AppText color="primary" variant="overline">İŞLETME OLUŞTURULDU</AppText>
          <AppText style={styles.successName} variant="heading">{createdName}</AppText>
          <AppText color="textMuted">İşletmen keşfette görünmeden önce hizmetlerini, ekibini ve çalışma saatlerini tamamlamalısın.</AppText>
        </AppCard>
        {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
        <View style={styles.primaryAction}>
          <AppButton onPress={() => void openBusinessSetup()}>
            Kurulumu Tamamla
          </AppButton>
        </View>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout description={stepDescriptions[step]} onBackPress={goBack} title={stepTitles[step]}>
      <ProgressIndicator currentStep={step} />

      {step === 0 ? (
        <AppCard style={styles.formCard}>
          <AppText style={styles.cardTitle} variant="cardTitle">Temel bilgiler</AppText>
          <AuthTextField autoCapitalize="words" icon={{ ios: "storefront", android: "storefront", web: "storefront" }} label="İşletme adı" onChangeText={changeName} placeholder="Örn. Trimly Barber" value={name} />
          <AuthTextField autoComplete="tel" icon={{ ios: "phone", android: "phone", web: "phone" }} keyboardType="phone-pad" label="İşletme telefonu" onChangeText={(value) => setPhone(formatTurkishPhoneInput(value))} placeholder="+90 5xx xxx xx xx" value={phone} />
          <AuthTextField autoCapitalize="none" autoCorrect={false} icon={{ ios: "link", android: "link", web: "link" }} label="Özel bağlantı" onChangeText={(value) => { setSlugEdited(true); setSlugStatus("idle"); setSlug(createSlug(value)); }} placeholder="trimly-barber" value={slug} />
          <SlugFeedback slug={slug} status={slugStatus} />
        </AppCard>
      ) : null}

      {step === 1 ? (
        <AppCard style={styles.formCard}>
          <AppText style={styles.cardTitle} variant="cardTitle">İşletme konumu</AppText>
          <AppText color="textMuted" style={styles.cardCopy} variant="bodySmall">Müşterilerin seni doğru bulabilmesi için adresini eksiksiz seç.</AppText>
          <View style={styles.locationFields}>
            <LocationSelectField label="İl" loading={isLoadingProvinces} onChange={(option) => void selectProvince(option)} options={provinces} placeholder="İl seç" value={province} />
            <LocationSelectField disabled={!province} label="İlçe" loading={isLoadingDistricts} onChange={(option) => void selectDistrict(option)} options={districts} placeholder="Önce il seç" value={district} />
            <LocationSelectField disabled={!district} label="Mahalle" loading={isLoadingNeighborhoods} onChange={(option) => { setNeighborhood(option); setBusinessLocation(null); setLocationMethod(null); }} options={neighborhoods} placeholder="Önce ilçe seç" value={neighborhood} />
            <AuthTextField autoComplete="street-address" icon={{ ios: "building.2", android: "home_work", web: "home_work" }} label="Açık adres" multiline onChangeText={(value) => { setOpenAddress(value); setBusinessLocation(null); setLocationMethod(null); }} placeholder="Cadde, sokak, bina ve kapı no" style={styles.addressInput} value={openAddress} />
          </View>
          <View style={styles.verifyAction}>
            <AppText style={styles.locationChoiceTitle} variant="label">Konumu haritada nasıl işaretleyelim?</AppText>
            <LocationMethodCard
              disabled={isLocating}
              icon={{ ios: "map.fill", android: "map", web: "map" }}
              onPress={() => void openMapPicker()}
              selected={locationMethod === "map"}
              subtitle="Haritadaki aramayla işletmeni bul ve doğru noktayı işaretle."
              title={locatingMethod === "map" ? "Harita hazırlanıyor…" : "Haritadan konum seç"}
            />
            <LocationMethodCard
              disabled={isLocating}
              icon={{ ios: "location.fill", android: "my_location", web: "my_location" }}
              onPress={() => void captureCurrentBusinessLocation()}
              selected={locationMethod === "current"}
              subtitle="Şu anda işletmenin içindeysen en doğru noktayı kullanır."
              title={locatingMethod === "current" ? "Mevcut konum alınıyor…" : "Mevcut konumumu kullan"}
            />
            {businessLocation ? (
              <View style={[styles.verifiedRow, { backgroundColor: themeColors.successSurface }]}>
                <SymbolView name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }} size={18} tintColor={themeColors.success} />
                <View style={styles.verifiedCopy}>
                  <AppText color="success" variant="label">Konum doğrulandı</AppText>
                  <AppText color="success" variant="bodySmall">{locationMethod === "current" ? "İşletmenin mevcut GPS konumu kaydedilecek." : "Haritada işaretlediğin konum kaydedilecek."}</AppText>
                </View>
              </View>
            ) : null}
          </View>
        </AppCard>
      ) : null}

      <BusinessLocationMapPicker
        initialCoordinate={mapInitialCoordinate}
        initiallyConfirmed={locationMethod === "map"}
        key={`${isMapVisible}-${mapInitialCoordinate.latitude}-${mapInitialCoordinate.longitude}`}
        onClose={() => setMapVisible(false)}
        onConfirm={(coordinate) => {
          setBusinessLocation(coordinate);
          setLocationMethod("map");
          setMapVisible(false);
        }}
        visible={isMapVisible}
      />

      {step === 2 ? (
        <AppCard style={styles.formCard}>
          <AppText style={styles.cardTitle} variant="cardTitle">İşletme görselleri</AppText>
          <AppText color="textMuted" style={styles.cardCopy} variant="bodySmall">Profil fotoğrafın ve işletmeni anlatan en az iki galeri fotoğrafı zorunlu.</AppText>
          <MediaPickerCard image={profilePhoto} label="Profil fotoğrafı" onPress={() => void pickProfilePhoto()} onRemove={profilePhoto ? () => setProfilePhoto(null) : undefined} status={profilePhoto ? "Hazır" : "1 fotoğraf gerekli"} />
          <View style={styles.galleryHeader}>
            <View>
              <AppText variant="label">Galeri fotoğrafları</AppText>
              <AppText color={galleryPhotos.length >= 2 ? "success" : "textMuted"} variant="bodySmall">{galleryPhotos.length}/2 minimum · En fazla 8</AppText>
            </View>
            <AppButton disabled={galleryPhotos.length >= 8} onPress={() => void pickGalleryPhotos()} variant="ghost">Fotoğraf Ekle</AppButton>
          </View>
          {galleryPhotos.length ? (
            <View style={styles.galleryGrid}>
              {galleryPhotos.map((photo, index) => (
                <View key={photo.uri} style={styles.galleryItem}>
                  <Image contentFit="cover" source={photo.uri} style={styles.galleryImage} />
                  {index === 0 ? <View style={styles.coverBadge}><AppText style={styles.coverBadgeText} variant="overline">KAPAK</AppText></View> : null}
                  <Pressable accessibilityLabel="Galeri fotoğrafını kaldır" accessibilityRole="button" onPress={() => setGalleryPhotos((current) => current.filter((item) => item.uri !== photo.uri))} style={styles.removePhoto}>
                    <SymbolView name={{ ios: "xmark", android: "close", web: "close" }} size={14} tintColor="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Pressable onPress={() => void pickGalleryPhotos()} style={[styles.emptyGallery, { borderColor: themeColors.border }]}>
              <SymbolView name={{ ios: "photo.on.rectangle.angled", android: "add_photo_alternate", web: "add_photo_alternate" }} size={27} tintColor={themeColors.primary} />
              <AppText color="textMuted" variant="bodySmall">Galeriden fotoğraf seç</AppText>
            </Pressable>
          )}
        </AppCard>
      ) : null}

      {step === 3 ? (
        <AppCard style={styles.previewCard}>
          <View style={styles.previewHero}>
            {galleryPhotos[0] ? <Image contentFit="cover" source={galleryPhotos[0].uri} style={StyleSheet.absoluteFill} /> : null}
            <View style={styles.previewOverlay} />
            {profilePhoto ? <Image contentFit="cover" source={profilePhoto.uri} style={styles.previewAvatar} /> : null}
            <View style={styles.previewIdentity}>
              <AppText color="onPrimary" numberOfLines={2} style={styles.previewName} variant="displayMedium">{name.trim()}</AppText>
              <AppText color="onPrimary" variant="bodySmall">Yayına hazır işletme profili</AppText>
            </View>
          </View>
          <PreviewRow icon={{ ios: "mappin", android: "location_on", web: "location_on" }} label="Adres" value={fullAddress} />
          <PreviewRow icon={{ ios: "phone", android: "phone", web: "phone" }} label="Telefon" value={phone} />
          <PreviewRow icon={{ ios: "link", android: "link", web: "link" }} label="Bağlantı" value={`trimly.app/${slug}`} />
          <View style={[styles.readyNote, { backgroundColor: themeColors.successSurface }]}>
            <SymbolView name={{ ios: "checkmark.seal.fill", android: "verified", web: "verified" }} size={22} tintColor={themeColors.success} />
            <AppText color="success" style={styles.readyText} variant="bodySmall">Zorunlu bilgiler, konum ve görseller tamamlandı.</AppText>
          </View>
        </AppCard>
      ) : null}

      {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
      <View style={styles.navigation}>
        {step > 0 ? <View style={styles.backAction}><AppButton disabled={isSubmitting} onPress={goBack} variant="secondary">Geri</AppButton></View> : null}
        <View style={styles.nextAction}>
          <AppButton disabled={!canContinue || isSubmitting} onPress={step === steps.length - 1 ? () => void submit() : continueToNextStep}>
            {isSubmitting ? "İşletmen hazırlanıyor…" : step === steps.length - 1 ? "İşletmeyi Oluştur" : "Devam Et"}
          </AppButton>
        </View>
      </View>
    </AuthScreenLayout>
  );
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <View style={styles.progress}>
      {steps.map((label, index) => (
        <View key={label} style={styles.progressItem}>
          <View style={[styles.progressDot, index <= currentStep && styles.progressDotActive]}>
            <AppText color={index <= currentStep ? "onPrimary" : "textMuted"} style={styles.progressNumber} variant="label">{index + 1}</AppText>
          </View>
          <AppText color={index === currentStep ? "text" : "textMuted"} numberOfLines={1} style={styles.progressLabel} variant="bodySmall">{label}</AppText>
        </View>
      ))}
    </View>
  );
}

function SlugFeedback({ slug, status }: { slug: string; status: SlugStatus }) {
  const themeColors = useThemeColors();
  const message = !slug
    ? "İşletme adına göre otomatik oluşturulur."
    : status === "checking"
      ? "Bağlantı kontrol ediliyor…"
      : status === "available"
        ? "Bu bağlantı kullanılabilir."
        : status === "taken"
          ? "Bu bağlantı başka bir işletme tarafından kullanılıyor."
          : status === "error"
            ? "Bağlantı uygunluğu şu an kontrol edilemedi."
            : "Yalnızca küçük harf, sayı ve tire kullanılabilir.";
  return (
    <View style={styles.slugFeedback}>
      <SymbolView name={{ ios: status === "available" ? "checkmark.circle.fill" : "info.circle", android: status === "available" ? "check_circle" : "info", web: status === "available" ? "check_circle" : "info" }} size={16} tintColor={status === "available" ? themeColors.success : status === "taken" ? themeColors.danger : themeColors.textMuted} />
      <AppText color={status === "available" ? "success" : status === "taken" ? "danger" : "textMuted"} style={styles.slugText} variant="bodySmall">trimly.app/{slug || "isletme-adi"} · {message}</AppText>
    </View>
  );
}

function MediaPickerCard({ image, label, onPress, onRemove, status }: { image: Photo | null; label: string; onPress: () => void; onRemove?: () => void; status: string }) {
  const themeColors = useThemeColors();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.mediaCard, { backgroundColor: themeColors.background, borderColor: themeColors.border }, pressed && styles.pressed]}>
      {image ? <Image contentFit="cover" source={image.uri} style={styles.mediaPreview} /> : <View style={[styles.mediaPlaceholder, { backgroundColor: themeColors.surfaceMuted }]}><SymbolView name={{ ios: "photo.badge.plus", android: "add_a_photo", web: "add_a_photo" }} size={25} tintColor={themeColors.primary} /></View>}
      <View style={styles.mediaCopy}><AppText variant="label">{label}</AppText><AppText color={image ? "success" : "textMuted"} variant="bodySmall">{status}</AppText></View>
      {onRemove ? <Pressable accessibilityLabel={`${label} kaldır`} hitSlop={8} onPress={onRemove} style={styles.mediaRemove}><SymbolView name={{ ios: "trash", android: "delete", web: "delete" }} size={18} tintColor={themeColors.danger} /></Pressable> : <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={18} tintColor={themeColors.textMuted} />}
    </Pressable>
  );
}

function LocationMethodCard({ disabled, icon, onPress, selected, subtitle, title }: {
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
          backgroundColor: selected ? themeColors.successSurface : themeColors.background,
          borderColor: selected ? themeColors.success : themeColors.border,
        },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.locationMethodIcon, { backgroundColor: themeColors.surfaceMuted }]}>
        <SymbolView name={icon} size={21} tintColor={selected ? themeColors.success : themeColors.primary} />
      </View>
      <View style={styles.locationMethodCopy}>
        <AppText style={styles.locationMethodTitle} variant="label">{title}</AppText>
        <AppText color="textMuted" style={styles.locationMethodSubtitle} variant="bodySmall">{subtitle}</AppText>
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

function PreviewRow({ icon, label, value }: { icon: SymbolViewProps["name"]; label: string; value: string }) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.previewRow}>
      <View style={[styles.previewIcon, { backgroundColor: themeColors.background }]}><SymbolView name={icon} size={18} tintColor={themeColors.primary} /></View>
      <View style={styles.previewCopy}><AppText color="textMuted" variant="bodySmall">{label}</AppText><AppText>{value}</AppText></View>
    </View>
  );
}

function createSlug(value: string) {
  return value.toLocaleLowerCase("tr-TR").replaceAll("ı", "i").replaceAll("ğ", "g").replaceAll("ü", "u").replaceAll("ş", "s").replaceAll("ö", "o").replaceAll("ç", "c").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function formatTurkishPhoneInput(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  else if (digits.startsWith("90")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "";
  return `+90 ${[
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ].filter(Boolean).join(" ")}`;
}

function normalizeTurkishPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^90/, "");
  return /^[2-5]\d{9}$/.test(digits) ? `+90${digits}` : null;
}

function stepError(step: number, slugStatus: SlugStatus) {
  if (step === 0) {
    if (slugStatus === "taken") return "Farklı bir özel bağlantı seçmelisin.";
    return "İşletme adı, geçerli telefon ve kullanılabilir bağlantı zorunlu.";
  }
  if (step === 1) return "Adres alanlarını tamamlayıp konumu doğrulamalısın.";
  return "Profil fotoğrafı ve en az iki galeri fotoğrafı eklemelisin.";
}

const styles = StyleSheet.create({
  progress: { flexDirection: "row", marginTop: spacing.xl },
  progressItem: { alignItems: "center", flex: 1 },
  progressDot: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 28, justifyContent: "center", width: 28 },
  progressDotActive: { backgroundColor: colors.primary },
  progressNumber: { fontSize: 11, lineHeight: 14 },
  progressLabel: { fontSize: 10, marginTop: spacing.xxs, textAlign: "center" },
  formCard: { marginTop: spacing.lg, padding: spacing.md },
  cardTitle: { fontSize: 18, lineHeight: 23 },
  cardCopy: { lineHeight: 19, marginTop: spacing.xs },
  locationFields: { gap: spacing.sm, marginTop: spacing.md },
  addressInput: { minHeight: 68, paddingTop: spacing.sm, textAlignVertical: "top" },
  verifyAction: { gap: spacing.sm, marginTop: spacing.lg },
  locationChoiceTitle: { marginBottom: spacing.xxs },
  locationMethod: { alignItems: "center", borderRadius: radius.smallCard, borderWidth: 1, flexDirection: "row", minHeight: 76, padding: spacing.sm },
  locationMethodIcon: { alignItems: "center", borderRadius: radius.pill, height: 40, justifyContent: "center", width: 40 },
  locationMethodCopy: { flex: 1, marginHorizontal: spacing.sm },
  locationMethodTitle: { lineHeight: 19 },
  locationMethodSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  verifiedRow: { alignItems: "center", borderRadius: radius.smallCard, flexDirection: "row", padding: spacing.sm },
  verifiedCopy: { flex: 1, gap: 2, marginLeft: spacing.xs },
  slugFeedback: { alignItems: "flex-start", flexDirection: "row", marginTop: spacing.sm },
  slugText: { flex: 1, lineHeight: 18, marginLeft: spacing.xs },
  mediaCard: { alignItems: "center", borderRadius: radius.smallCard, borderWidth: 1, flexDirection: "row", marginTop: spacing.lg, minHeight: 82, padding: spacing.sm },
  mediaPreview: { borderRadius: radius.md, height: 58, width: 58 },
  mediaPlaceholder: { alignItems: "center", borderRadius: radius.md, height: 58, justifyContent: "center", width: 58 },
  mediaCopy: { flex: 1, gap: spacing.xxs, marginLeft: spacing.sm },
  mediaRemove: { alignItems: "center", height: 38, justifyContent: "center", width: 38 },
  galleryHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: spacing.lg },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
  galleryItem: { borderRadius: radius.md, height: 92, overflow: "hidden", position: "relative", width: "31%" },
  galleryImage: { height: "100%", width: "100%" },
  coverBadge: { backgroundColor: "rgba(0,0,0,0.65)", borderRadius: radius.pill, bottom: 5, left: 5, paddingHorizontal: 7, paddingVertical: 3, position: "absolute" },
  coverBadgeText: { color: "#FFFFFF", fontSize: 8, lineHeight: 10 },
  removePhoto: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.72)", borderRadius: radius.pill, height: 26, justifyContent: "center", position: "absolute", right: 5, top: 5, width: 26 },
  emptyGallery: { alignItems: "center", borderRadius: radius.smallCard, borderStyle: "dashed", borderWidth: 1, gap: spacing.xs, justifyContent: "center", marginTop: spacing.sm, minHeight: 116 },
  previewCard: { marginTop: spacing.lg, overflow: "hidden", padding: 0 },
  previewHero: { alignItems: "center", flexDirection: "row", minHeight: 150, padding: spacing.lg },
  previewOverlay: { backgroundColor: "rgba(20,14,9,0.58)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  previewAvatar: { borderColor: "rgba(255,255,255,0.8)", borderRadius: radius.pill, borderWidth: 2, height: 72, width: 72 },
  previewIdentity: { flex: 1, marginLeft: spacing.md },
  previewName: { fontSize: 23, lineHeight: 28 },
  previewRow: { alignItems: "center", flexDirection: "row", minHeight: 68, paddingHorizontal: spacing.md },
  previewIcon: { alignItems: "center", borderRadius: radius.pill, height: 36, justifyContent: "center", width: 36 },
  previewCopy: { flex: 1, gap: 2, marginLeft: spacing.sm },
  readyNote: { alignItems: "center", borderRadius: radius.smallCard, flexDirection: "row", margin: spacing.md, padding: spacing.md },
  readyText: { flex: 1, marginLeft: spacing.sm },
  error: { lineHeight: 20, marginTop: spacing.md, textAlign: "center" },
  navigation: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  backAction: { flex: 0.38 },
  nextAction: { flex: 1 },
  primaryAction: { marginTop: spacing.xl },
  successCard: { marginTop: spacing.xl, padding: spacing.xl },
  successName: { marginBottom: spacing.sm, marginTop: spacing.xs },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.68 },
});
