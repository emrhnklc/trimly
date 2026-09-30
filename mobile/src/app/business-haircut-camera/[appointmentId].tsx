import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { uploadBusinessHaircutPhoto } from '@/features/haircut-history/api';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

const MAX_HAIRCUT_PHOTOS = 8;

export default function BusinessHaircutCameraScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointmentId, photoCount } = useLocalSearchParams<{
    appointmentId?: string;
    photoCount?: string;
  }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapturing, setCapturing] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(() => {
    const parsedCount = Number(photoCount ?? 0);
    return Number.isFinite(parsedCount)
      ? Math.min(Math.max(parsedCount, 0), MAX_HAIRCUT_PHOTOS)
      : 0;
  });
  const [uploadSucceeded, setUploadSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openCamera() {
    if (!consentConfirmed || uploadedCount >= MAX_HAIRCUT_PHOTOS) return;

    setError(null);
    const result = permission?.granted ? permission : await requestPermission();
    if (!result.granted) {
      setError('Fotoğraf çekmek için kamera izni verilmelidir.');
      return;
    }
    setCameraReady(false);
    setUploadSucceeded(false);
    setCameraOpen(true);
  }

  async function takePhoto() {
    if (!cameraRef.current || !cameraReady || isCapturing) return;

    setCapturing(true);
    setError(null);
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!result?.uri) throw new Error('Fotoğraf oluşturulamadı.');
      setPhotoUri(result.uri);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Fotoğraf çekilemedi.');
    } finally {
      setCapturing(false);
    }
  }

  async function uploadPhoto() {
    if (!photoUri || !appointmentId || !activeMembership || !token) return;

    setUploading(true);
    setError(null);
    try {
      await uploadBusinessHaircutPhoto(
        activeMembership.barbershop.id,
        appointmentId,
        { uri: photoUri, mimeType: 'image/jpeg' },
        token,
      );
      setUploadedCount((current) => Math.min(current + 1, MAX_HAIRCUT_PHOTOS));
      setPhotoUri(null);
      setCameraOpen(false);
      setUploadSucceeded(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Fotoğraf yüklenemedi.');
    } finally {
      setUploading(false);
    }
  }

  if (cameraOpen && !photoUri) {
    return (
      <View style={styles.cameraScreen}>
        <CameraView
          active
          facing="back"
          mode="picture"
          onCameraReady={() => setCameraReady(true)}
          onMountError={({ message }) => setError(message)}
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          accessibilityLabel="Kamerayı kapat"
          accessibilityRole="button"
          onPress={() => setCameraOpen(false)}
          style={[styles.closeButton, { top: insets.top + spacing.sm }]}
        >
          <SymbolView
            name={{ ios: 'xmark', android: 'close', web: 'close' }}
            size={20}
            tintColor="#FFFFFF"
          />
        </Pressable>
        {error ? (
          <View style={styles.cameraError}>
            <AppText color="onPrimary" variant="bodySmall">{error}</AppText>
          </View>
        ) : null}
        <View style={[styles.cameraControls, { paddingBottom: insets.bottom + spacing.lg }]}>
          <AppText color="onPrimary" style={styles.cameraHint} variant="bodySmall">
            Tıraş sonucunu kadraja yerleştir
          </AppText>
          <Pressable
            accessibilityLabel="Fotoğraf çek"
            accessibilityRole="button"
            disabled={!cameraReady || isCapturing}
            onPress={() => void takePhoto()}
            style={[styles.shutterOuter, (!cameraReady || isCapturing) && styles.disabled]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        </View>
      </View>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.cameraScreen}>
        <Image contentFit="cover" source={photoUri} style={StyleSheet.absoluteFill} />
        <View style={[styles.previewControls, { paddingBottom: insets.bottom + spacing.md }]}>
          {error ? <AppText color="onPrimary" variant="bodySmall">{error}</AppText> : null}
          <View style={styles.previewButtons}>
            <Pressable
              accessibilityRole="button"
              disabled={isUploading}
              onPress={() => setPhotoUri(null)}
              style={styles.previewSecondary}
            >
              <AppText color="onPrimary" variant="label">Tekrar Çek</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isUploading}
              onPress={() => void uploadPhoto()}
              style={[styles.previewPrimary, isUploading && styles.disabled]}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AppText color="onPrimary" variant="label">Güvenle Yükle</AppText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader onBack={() => router.back()} title="Tıraş Fotoğrafı" />
      </View>
      <View style={styles.consentContent}>
        <View style={[styles.consentIcon, { backgroundColor: themeColors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
            size={30}
            tintColor={themeColors.primary}
          />
        </View>
        <AppText style={styles.consentTitle} variant="heading">
          {uploadSucceeded ? 'Fotoğraf eklendi' : 'Önce müşteri izni'}
        </AppText>
        <AppText color="textMuted" style={styles.consentDescription}>
          {uploadSucceeded
            ? `${uploadedCount}/${MAX_HAIRCUT_PHOTOS} fotoğraf eklendi. İstersen farklı bir açıdan devam edebilirsin.`
            : 'Fotoğraf yalnız tıraş geçmişi için kullanılacak. İşletme galerisinde görünmeyecek ve telefon galerisine kaydedilmeyecek.'}
        </AppText>

        {!uploadSucceeded ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consentConfirmed }}
            onPress={() => setConsentConfirmed((value) => !value)}
            style={({ pressed }) => [styles.consentRow, { backgroundColor: themeColors.surface, borderColor: themeColors.border }, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, { borderColor: themeColors.border }, consentConfirmed && [styles.checkboxChecked, { backgroundColor: themeColors.primary, borderColor: themeColors.primary }]]}>
              {consentConfirmed ? (
                <SymbolView
                  name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                  size={15}
                  tintColor="#FFFFFF"
                />
              ) : null}
            </View>
            <AppText style={styles.consentLabel} variant="label">
              Müşteriden fotoğraf çekme ve Trimly’ye yükleme izni aldım.
            </AppText>
          </Pressable>
        ) : null}

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: themeColors.dangerSurface }]}>
            <AppText color="danger" variant="bodySmall">{error}</AppText>
          </View>
        ) : null}
        <View style={styles.openButton}>
          {uploadedCount < MAX_HAIRCUT_PHOTOS ? (
            <AppButton disabled={!consentConfirmed} onPress={() => void openCamera()}>
              {uploadSucceeded ? 'Bir Fotoğraf Daha Çek' : 'Kamerayı Aç'}
            </AppButton>
          ) : null}
          {uploadSucceeded || uploadedCount >= MAX_HAIRCUT_PHOTOS ? (
            <View style={styles.backToRecordButton}>
              <AppButton
                onPress={() =>
                  router.dismissTo({
                    pathname: '/business-haircut-record/[appointmentId]',
                    params: { appointmentId: appointmentId ?? '' },
                  })
                }
                variant="secondary"
              >
                Tıraş Kaydına Dön
              </AppButton>
            </View>
          ) : null}
        </View>
        <AppText color="textMuted" style={styles.galleryNote} variant="bodySmall">
          Galeriden yükleme kapalıdır; yalnız şimdi çekilen fotoğraf kabul edilir.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  consentContent: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl },
  consentIcon: {
    alignItems: 'center', borderRadius: radius.pill,
    height: 68, justifyContent: 'center', width: 68,
  },
  consentTitle: { fontSize: 21, lineHeight: 28, marginTop: spacing.md },
  consentDescription: { lineHeight: 21, marginTop: spacing.xs, textAlign: 'center' },
  consentRow: {
    alignItems: 'flex-start',
    borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', marginTop: spacing.xl,
    padding: spacing.md, width: '100%',
  },
  checkbox: {
    alignItems: 'center', borderRadius: 6, borderWidth: 1,
    height: 24, justifyContent: 'center', width: 24,
  },
  checkboxChecked: {},
  consentLabel: { flex: 1, lineHeight: 20, marginLeft: spacing.sm },
  errorBox: {
    borderRadius: radius.md, marginTop: spacing.md,
    padding: spacing.sm, width: '100%',
  },
  openButton: { marginTop: spacing.xl, width: '100%' },
  backToRecordButton: { marginTop: spacing.sm },
  galleryNote: { marginTop: spacing.sm, textAlign: 'center' },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.5 },
  cameraScreen: { backgroundColor: '#000000', flex: 1 },
  closeButton: {
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.48)', borderRadius: radius.pill,
    height: 44, justifyContent: 'center', left: spacing.md, position: 'absolute', width: 44,
  },
  cameraError: {
    backgroundColor: 'rgba(182,58,48,0.88)', borderRadius: radius.md, left: spacing.lg,
    padding: spacing.sm, position: 'absolute', right: spacing.lg, top: 120,
  },
  cameraControls: {
    alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.32)', bottom: 0, left: 0,
    paddingTop: spacing.md, position: 'absolute', right: 0,
  },
  cameraHint: { marginBottom: spacing.md },
  shutterOuter: {
    alignItems: 'center', borderColor: '#FFFFFF', borderRadius: radius.pill, borderWidth: 4,
    height: 76, justifyContent: 'center', width: 76,
  },
  shutterInner: { backgroundColor: '#FFFFFF', borderRadius: radius.pill, height: 60, width: 60 },
  previewControls: {
    backgroundColor: 'rgba(0,0,0,0.58)', bottom: 0, left: 0, paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, position: 'absolute', right: 0,
  },
  previewButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  previewSecondary: {
    alignItems: 'center', borderColor: '#FFFFFF', borderRadius: radius.md, borderWidth: 1,
    flex: 1, justifyContent: 'center', minHeight: 50,
  },
  previewPrimary: {
    alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md,
    flex: 1, justifyContent: 'center', minHeight: 50,
  },
});
