import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getBarbershopAccessSettings,
  rotateBarbershopAccessCode,
  updateBarbershopAccessSettings,
} from '@/features/barbershops/api';
import type {
  BarbershopAccessMode,
  BarbershopAccessSettings,
} from '@/features/barbershops/types';
import { createBarbershopAccessLink } from '@/features/barbershops/deep-link';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type AccessModeOption = {
  description: string;
  icon: SymbolViewProps['name'];
  mode: BarbershopAccessMode;
  title: string;
};

const accessModeOptions: AccessModeOption[] = [
  {
    description: 'İşletmeni bulan giriş yapmış müşteriler randevu akışına doğrudan geçebilir.',
    icon: { ios: 'globe', android: 'public', web: 'public' },
    mode: 'PUBLIC',
    title: 'Herkese açık',
  },
  {
    description: 'İşletme keşfette görünmez. Müşteri özel kodu bir kez doğruladıktan sonra randevu alabilir.',
    icon: { ios: 'key', android: 'key', web: 'key' },
    mode: 'CODE_REQUIRED',
    title: 'Özel kod gerekli',
  },
];

function formatUpdatedAt(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function BusinessAccessSettingsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const [settings, setSettings] = useState<BarbershopAccessSettings | null>(null);
  const [selectedMode, setSelectedMode] = useState<BarbershopAccessMode | null>(null);
  const [visibleCode, setVisibleCode] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isRotating, setRotating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!activeMembership || !token) return;

    setLoading(true);
    setError(null);
    try {
      const loaded = await getBarbershopAccessSettings(
        activeMembership.barbershop.id,
        token,
      );
      setSettings(loaded);
      setSelectedMode(loaded.accessMode);
      setVisibleCode(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu erişim ayarları yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, token]);

  useFocusEffect(
    useCallback(() => {
      void loadSettings();
    }, [loadSettings]),
  );

  if (!activeMembership) return null;

  const canManage = can('MANAGE_BUSINESS_PROFILE');
  const hasChanges = Boolean(settings && selectedMode !== settings.accessMode);
  const isBusy = isSaving || isRotating;

  async function createNewCode() {
    if (!token || !activeMembership || isBusy) return null;

    setRotating(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await rotateBarbershopAccessCode(
        activeMembership.barbershop.id,
        token,
      );
      setVisibleCode(result.code);
      setSettings((current) => current
        ? { ...current, hasAccessCode: true, accessCodeUpdatedAt: result.updatedAt }
        : current);
      setSuccess('Yeni erişim kodu hazır. Eski kod artık geçerli değil.');
      return result.code;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Yeni erişim kodu oluşturulamadı.');
      return null;
    } finally {
      setRotating(false);
    }
  }

  function confirmCodeRotation() {
    if (!settings?.hasAccessCode) {
      void createNewCode();
      return;
    }

    Alert.alert(
      'Erişim kodunu yenile',
      'Eski kod hemen geçersiz olacak. Daha önce erişim kazanmış müşterilerin izni devam eder.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yeni Kod Oluştur', onPress: () => void createNewCode() },
      ],
    );
  }

  async function saveMode() {
    if (!settings || !selectedMode || !token || !activeMembership || !hasChanges || isBusy) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let code = visibleCode;
      if (selectedMode === 'CODE_REQUIRED' && !settings.hasAccessCode) {
        const result = await rotateBarbershopAccessCode(
          activeMembership.barbershop.id,
          token,
        );
        code = result.code;
        setVisibleCode(result.code);
      }

      const saved = await updateBarbershopAccessSettings(
        activeMembership.barbershop.id,
        selectedMode,
        token,
      );
      setSettings(saved);
      setSuccess(
        selectedMode === 'CODE_REQUIRED'
          ? code
            ? 'Özel erişim açıldı ve ilk kodun oluşturuldu.'
            : 'Özel erişim açıldı.'
          : 'İşletme randevu erişimi herkese açıldı.',
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu erişim ayarı kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  }

  async function shareCode() {
    if (!visibleCode || !activeMembership) return;

    const accessLink = createBarbershopAccessLink(
      activeMembership.barbershop.slug,
      visibleCode,
    );

    await Share.share({
      message: `${activeMembership.barbershop.name} için Trimly erişim kodu: ${visibleCode}\n${accessLink}`,
      title: `${activeMembership.barbershop.name} erişim kodu`,
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          onBack={() => router.back()}
          title="Randevu Erişimi"
        />
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          İşletmene kimlerin ulaşabileceğini ve randevu alabileceğini belirle.
        </AppText>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error && !settings ? (
          <BusinessManagementState
            description={error}
            onRetry={() => void loadSettings()}
            title="Erişim ayarları yüklenemedi"
          />
        ) : null}

        {!isLoading && settings ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroIcon}>
                <SymbolView
                  name={{ ios: 'lock.shield', android: 'shield_lock', web: 'shield_lock' }}
                  size={30}
                  tintColor={colors.primary}
                />
              </View>
              <View style={styles.heroCopy}>
                <AppText color="onPrimary" style={styles.heroTitle} variant="heading">
                  Kontrollü randevu
                </AppText>
                <AppText style={styles.heroDescription} variant="bodySmall">
                  İstersen herkese açık kal, istersen yalnız tanıdığın müşterilere kod ver.
                </AppText>
              </View>
            </View>

            <AppText style={styles.sectionTitle} variant="heading">Erişim biçimi</AppText>
            <View accessibilityRole="radiogroup" style={styles.options}>
              {accessModeOptions.map((option) => {
                const selected = option.mode === selectedMode;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected, disabled: !canManage || isBusy }}
                    disabled={!canManage || isBusy}
                    key={option.mode}
                    onPress={() => {
                      setSelectedMode(option.mode);
                      setError(null);
                      setSuccess(null);
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.selectedOption,
                      pressed && styles.pressed,
                    ]}>
                    <View style={[styles.optionIcon, selected && styles.selectedOptionIcon]}>
                      <SymbolView name={option.icon} size={22} tintColor={colors.primary} />
                    </View>
                    <View style={styles.optionCopy}>
                      <AppText variant="label">{option.title}</AppText>
                      <AppText color="textMuted" style={styles.optionDescription} variant="bodySmall">
                        {option.description}
                      </AppText>
                    </View>
                    <View style={[styles.radio, selected && styles.selectedRadio]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {selectedMode === 'CODE_REQUIRED' ? (
              <>
                <AppText style={styles.sectionTitle} variant="heading">Özel erişim kodu</AppText>
                <AppCard style={styles.codeCard}>
                  {visibleCode ? (
                    <>
                      <AppText color="textMuted" variant="bodySmall">Yeni kodun</AppText>
                      <AppText selectable style={styles.code} variant="displayMedium">{visibleCode}</AppText>
                      <View style={styles.qrShell}>
                        <QRCode
                          backgroundColor={colors.onPrimary}
                          color={colors.text}
                          quietZone={10}
                          size={190}
                          value={createBarbershopAccessLink(
                            activeMembership.barbershop.slug,
                            visibleCode,
                          )}
                        />
                      </View>
                      <AppText color="textMuted" style={styles.codeNotice} variant="bodySmall">
                        Müşteri QR’ı telefon kamerasıyla okutabilir. Kod yalnızca şimdi gösterilir;
                        güvenli bir yerde sakla veya hemen paylaş.
                      </AppText>
                      <AppButton disabled={isBusy} onPress={() => void shareCode()}>
                        Kodu ve Linki Paylaş
                      </AppButton>
                    </>
                  ) : (
                    <>
                      <View style={styles.codeStatusRow}>
                        <View style={styles.codeStatusIcon}>
                          <SymbolView
                            name={{
                              ios: settings.hasAccessCode ? 'checkmark.shield' : 'key',
                              android: settings.hasAccessCode ? 'verified_user' : 'key',
                              web: settings.hasAccessCode ? 'verified_user' : 'key',
                            }}
                            size={22}
                            tintColor={colors.primary}
                          />
                        </View>
                        <View style={styles.optionCopy}>
                          <AppText variant="label">
                            {settings.hasAccessCode ? 'Aktif kod mevcut' : 'Henüz kod oluşturulmadı'}
                          </AppText>
                          <AppText color="textMuted" style={styles.optionDescription} variant="bodySmall">
                            {settings.hasAccessCode
                              ? 'Güvenlik için mevcut kod tekrar görüntülenemez. Yenilersen eski kod geçersiz olur.'
                              : 'Özel erişimi kaydettiğinde ilk kod otomatik oluşturulur.'}
                          </AppText>
                        </View>
                      </View>
                      {settings.accessCodeUpdatedAt ? (
                        <AppText color="textMuted" style={styles.updatedAt} variant="bodySmall">
                          Son yenileme: {formatUpdatedAt(settings.accessCodeUpdatedAt)}
                        </AppText>
                      ) : null}
                      {settings.hasAccessCode ? (
                        <AppButton
                          disabled={isBusy || !canManage}
                          onPress={confirmCodeRotation}
                          variant="secondary">
                          {isRotating ? 'Oluşturuluyor...' : 'Yeni Kod Oluştur'}
                        </AppButton>
                      ) : null}
                    </>
                  )}
                </AppCard>
              </>
            ) : null}

            {!canManage ? (
              <View style={[styles.message, styles.infoMessage]}>
                <AppText color="textMuted" variant="bodySmall">
                  Bu ayarı yalnız işletme sahibi veya yönetici değiştirebilir.
                </AppText>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.message, styles.errorMessage]}>
                <AppText color="danger" variant="bodySmall">{error}</AppText>
              </View>
            ) : null}

            {success ? (
              <View style={[styles.message, styles.successMessage]}>
                <AppText style={styles.successText} variant="bodySmall">{success}</AppText>
              </View>
            ) : null}

            <AppButton disabled={!canManage || !hasChanges || isBusy} onPress={() => void saveMode()}>
              {isSaving ? 'Kaydediliyor...' : hasChanges ? 'Erişimi Kaydet' : 'Değişiklik Yok'}
            </AppButton>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.md },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  heroCopy: { flex: 1, marginLeft: spacing.md },
  heroTitle: { fontSize: 18, lineHeight: 24 },
  heroDescription: { color: '#EADFCB', marginTop: 3 },
  sectionTitle: { fontSize: 17, lineHeight: 23, marginBottom: spacing.sm, marginTop: spacing.xl },
  options: { gap: spacing.sm },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 104,
    padding: spacing.md,
  },
  selectedOption: { backgroundColor: '#FFFAED', borderColor: colors.primary },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  selectedOptionIcon: { backgroundColor: '#F6E9C8' },
  optionCopy: { flex: 1, marginHorizontal: spacing.sm },
  optionDescription: { marginTop: 3 },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  selectedRadio: { borderColor: colors.primary },
  radioDot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 10, width: 10 },
  codeCard: { padding: spacing.md },
  code: { color: colors.primary, fontSize: 32, letterSpacing: 5, lineHeight: 40, marginVertical: spacing.xs },
  codeNotice: { marginBottom: spacing.md },
  qrShell: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.onPrimary,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  codeStatusRow: { alignItems: 'center', flexDirection: 'row' },
  codeStatusIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  updatedAt: { marginBottom: spacing.sm, marginTop: spacing.sm },
  message: { borderRadius: radius.md, marginBottom: spacing.sm, marginTop: spacing.sm, padding: spacing.sm },
  errorMessage: { backgroundColor: '#F8E7E3' },
  successMessage: { backgroundColor: '#E8F1E5' },
  successText: { color: '#4F7653' },
  infoMessage: { backgroundColor: colors.surfaceMuted },
  pressed: { opacity: 0.7 },
});
