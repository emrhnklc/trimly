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

export default function BusinessHaircutCameraScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
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
  const [error, setError] = useState<string | null>(null);

  async function openCamera() {
    if (!consentConfirmed) return;

    setError(null);
    const result = permission?.granted ? permission : await requestPermission();
    if (!result.granted) {
      setError('Fotoğraf çekmek için kamera izni verilmelidir.');
      return;
    }
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
      router.dismissTo({
        pathname: '/business-appointments/[appointmentId]',
        params: { appointmentId },
      });
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
          onPress={() => router.back()}
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
        <View style={styles.consentIcon}>
          <SymbolView
            name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
            size={30}
            tintColor={colors.primary}
          />
        </View>
        <AppText style={styles.consentTitle} variant="heading">Önce müşteri izni</AppText>
        <AppText color="textMuted" style={styles.consentDescription}>
          Fotoğraf yalnız tıraş geçmişi için kullanılacak. İşletme galerisinde görünmeyecek ve telefon galerisine kaydedilmeyecek.
        </AppText>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consentConfirmed }}
          onPress={() => setConsentConfirmed((value) => !value)}
          style={({ pressed }) => [styles.consentRow, pressed && styles.pressed]}
        >
          <View style={[styles.checkbox, consentConfirmed && styles.checkboxChecked]}>
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

        {error ? (
          <View style={styles.errorBox}>
            <AppText color="danger" variant="bodySmall">{error}</AppText>
          </View>
        ) : null}
        <View style={styles.openButton}>
          <AppButton disabled={!consentConfirmed} onPress={() => void openCamera()}>
            Kamerayı Aç
          </AppButton>
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
    alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill,
    height: 68, justifyContent: 'center', width: 68,
  },
  consentTitle: { fontSize: 21, lineHeight: 28, marginTop: spacing.md },
  consentDescription: { lineHeight: 21, marginTop: spacing.xs, textAlign: 'center' },
  consentRow: {
    alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border,
    borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', marginTop: spacing.xl,
    padding: spacing.md, width: '100%',
  },
  checkbox: {
    alignItems: 'center', borderColor: colors.border, borderRadius: 6, borderWidth: 1,
    height: 24, justifyContent: 'center', width: 24,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  consentLabel: { flex: 1, lineHeight: 20, marginLeft: spacing.sm },
  errorBox: {
    backgroundColor: '#F8E8E5', borderRadius: radius.md, marginTop: spacing.md,
    padding: spacing.sm, width: '100%',
  },
  openButton: { marginTop: spacing.xl, width: '100%' },
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
