import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getPublicBarbershop,
  updateBarbershopProfile,
} from '@/features/barbershops/api';
import type { UpdateBarbershopProfileInput } from '@/features/barbershops/types';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { BusinessProfilePreview } from '@/features/business-settings/components/BusinessProfilePreview';
import { BusinessSettingsField } from '@/features/business-settings/components/BusinessSettingsField';
import { BusinessVisibilityCard } from '@/features/business-settings/components/BusinessVisibilityCard';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function serializeProfile(profile: UpdateBarbershopProfileInput | null) {
  return profile ? JSON.stringify(profile) : '';
}

function isValidOptionalUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const { refreshUser, token } = useAuth();
  const { activeMembership } = useBusiness();
  const [profile, setProfile] = useState<UpdateBarbershopProfileInput | null>(null);
  const [savedProfile, setSavedProfile] = useState<UpdateBarbershopProfileInput | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!activeMembership) return;

    setLoading(true);
    setLoadError(null);
    try {
      const barbershop = await getPublicBarbershop(activeMembership.barbershop.slug);
      const nextProfile: UpdateBarbershopProfileInput = {
        address: barbershop.address ?? '',
        coverImageUrl: barbershop.coverImageUrl ?? '',
        description: barbershop.description ?? '',
        isDiscoverable: barbershop.isDiscoverable,
        name: barbershop.name,
        phone: barbershop.phone ?? '',
        profileImageUrl: barbershop.profileImageUrl ?? '',
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'İşletme bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const hasChanges = serializeProfile(profile) !== serializeProfile(savedProfile);

  if (!activeMembership) return null;

  function updateProfile(updates: Partial<UpdateBarbershopProfileInput>) {
    setProfile((current) => (current ? { ...current, ...updates } : current));
    setSubmitError(null);
    setSuccessMessage(null);
  }

  function handleBack() {
    if (!hasChanges) {
      router.dismissTo('/management');
      return;
    }

    Alert.alert(
      'Kaydedilmemiş değişiklikler',
      'İşletme bilgilerinde yaptığın değişiklikler kaybolacak.',
      [
        { text: 'Düzenlemeye Devam Et', style: 'cancel' },
        {
          text: 'Değişiklikleri Sil',
          style: 'destructive',
          onPress: () => router.dismissTo('/management'),
        },
      ],
    );
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
      setSubmitError('İşletme adı en az 2 karakter olmalı.');
      return;
    }
    if (!normalizedProfile.address) {
      setSubmitError('Müşterilerin işletmeyi bulabilmesi için adres zorunludur.');
      return;
    }
    if (!isValidOptionalUrl(normalizedProfile.profileImageUrl)) {
      setSubmitError('Profil fotoğrafı için geçerli bir HTTPS bağlantısı kullanmalısın.');
      return;
    }
    if (!isValidOptionalUrl(normalizedProfile.coverImageUrl)) {
      setSubmitError('Kapak fotoğrafı için geçerli bir HTTPS bağlantısı kullanmalısın.');
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
        address: saved.address ?? '',
        coverImageUrl: saved.coverImageUrl ?? '',
        description: saved.description ?? '',
        isDiscoverable: saved.isDiscoverable,
        name: saved.name,
        phone: saved.phone ?? '',
        profileImageUrl: saved.profileImageUrl ?? '',
      };
      setProfile(nextProfile);
      setSavedProfile(nextProfile);
      await refreshUser();
      setSuccessMessage('İşletme bilgileri kaydedildi. Müşteri profili de güncellendi.');
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'İşletme bilgileri kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BusinessDetailHeader onBack={handleBack} title="İşletme Ayarları" />
          <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
            Müşterilerin göreceği işletme profilini, konumu ve görünürlüğü yönet.
          </AppText>

          {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

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
                profileImageUrl={profile.profileImageUrl}
              />

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="heading">Profil bilgileri</AppText>
              </View>
              <AppCard style={styles.formCard}>
                <BusinessSettingsField
                  autoCapitalize="words"
                  icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                  label="İşletme adı"
                  maxLength={100}
                  onChangeText={(value) => updateProfile({ name: value })}
                  placeholder="İşletme adı"
                  value={profile.name}
                />
                <BusinessSettingsField
                  icon={{ ios: 'text.alignleft', android: 'notes', web: 'notes' }}
                  label="Açıklama"
                  maxLength={1000}
                  multiline
                  onChangeText={(value) => updateProfile({ description: value })}
                  placeholder="İşletmeni ve sunduğun deneyimi anlat"
                  value={profile.description}
                />
              </AppCard>

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="heading">İletişim ve konum</AppText>
              </View>
              <AppCard style={styles.formCard}>
                <BusinessSettingsField
                  icon={{ ios: 'phone', android: 'phone', web: 'phone' }}
                  keyboardType="phone-pad"
                  label="Telefon"
                  maxLength={30}
                  onChangeText={(value) => updateProfile({ phone: value })}
                  placeholder="+90 5xx xxx xx xx"
                  value={profile.phone}
                />
                <BusinessSettingsField
                  autoCapitalize="words"
                  icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
                  label="Adres"
                  maxLength={500}
                  multiline
                  onChangeText={(value) => updateProfile({ address: value })}
                  placeholder="Mahalle, sokak, ilçe ve şehir"
                  value={profile.address}
                />
              </AppCard>

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="heading">Profil görselleri</AppText>
              </View>
              <AppCard style={styles.formCard}>
                <BusinessSettingsField
                  autoCapitalize="none"
                  autoCorrect={false}
                  horizontal
                  icon={{ ios: 'person.crop.square', android: 'account_box', web: 'account_box' }}
                  keyboardType="url"
                  label="Profil fotoğrafı"
                  maxLength={2048}
                  onChangeText={(value) => updateProfile({ profileImageUrl: value })}
                  placeholder="Fotoğraf bağlantısı"
                  value={profile.profileImageUrl}
                />
                <BusinessSettingsField
                  autoCapitalize="none"
                  autoCorrect={false}
                  horizontal
                  icon={{ ios: 'photo.on.rectangle', android: 'image', web: 'image' }}
                  keyboardType="url"
                  label="Kapak fotoğrafı"
                  maxLength={2048}
                  onChangeText={(value) => updateProfile({ coverImageUrl: value })}
                  placeholder="Fotoğraf bağlantısı"
                  value={profile.coverImageUrl}
                />
              </AppCard>

              <View style={styles.sectionHeading}>
                <AppText style={styles.sectionTitle} variant="heading">Görünürlük</AppText>
                <AppText color="textMuted" variant="bodySmall">
                  İşletmenin keşfet ve arama sonuçlarındaki durumunu belirle.
                </AppText>
              </View>
              <BusinessVisibilityCard
                onChange={(value) => updateProfile({ isDiscoverable: value })}
                value={profile.isDiscoverable}
              />

              <View style={styles.identityCard}>
                <View style={styles.identityIcon}>
                  <SymbolView
                    name={{ ios: 'link', android: 'link', web: 'link' }}
                    size={20}
                    tintColor={colors.primary}
                  />
                </View>
                <View style={styles.identityCopy}>
                  <AppText variant="label">Kalıcı işletme bağlantısı</AppText>
                  <AppText color="textMuted" variant="bodySmall">
                    trimly.app/barber/{activeMembership.barbershop.slug}
                  </AppText>
                  <AppText color="textMuted" style={styles.timezone} variant="bodySmall">
                    Saat dilimi: {activeMembership.barbershop.timezone}
                  </AppText>
                </View>
              </View>

              {submitError ? (
                <View style={[styles.message, styles.errorMessage]}>
                  <AppText color="danger" variant="bodySmall">{submitError}</AppText>
                </View>
              ) : null}

              {successMessage ? (
                <View style={[styles.message, styles.successMessage]}>
                  <AppText style={styles.successText} variant="bodySmall">{successMessage}</AppText>
                </View>
              ) : null}

              <AppButton disabled={isSubmitting || !hasChanges} onPress={() => void handleSave()}>
                {isSubmitting ? 'Kaydediliyor...' : hasChanges ? 'İşletmeyi Kaydet' : 'Değişiklik Yok'}
              </AppButton>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 116, paddingHorizontal: spacing.md },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  sectionHeading: { marginBottom: spacing.xs, marginTop: spacing.md },
  sectionTitle: { fontSize: 16, lineHeight: 22 },
  formCard: { paddingBottom: spacing.sm, paddingTop: 0 },
  identityCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  identityIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  identityCopy: { flex: 1, marginLeft: spacing.sm },
  timezone: { marginTop: 2 },
  message: { borderRadius: radius.md, marginBottom: spacing.sm, padding: spacing.sm },
  errorMessage: { backgroundColor: '#F8E7E3' },
  successMessage: { backgroundColor: '#E8F1E5' },
  successText: { color: '#4F7653' },
});
