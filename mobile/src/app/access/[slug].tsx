import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicBarbershop, redeemBarbershopAccess } from '@/features/barbershops/api';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function BarbershopAccessLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[]; slug?: string | string[] }>();
  const { token, user } = useAuth();
  const { enterCustomerMode } = useAppMode();
  const slug = normalizeParam(params.slug)?.trim().toLowerCase() ?? '';
  const code = normalizeParam(params.code)?.replace(/[^A-Z0-9]/gi, '').toUpperCase() ?? '';
  const attemptKey = `${user?.id ?? 'guest'}:${slug}:${code}`;
  const attemptedKey = useRef<string | null>(null);
  const [barbershopName, setBarbershopName] = useState<string | null>(null);
  const [isRedeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!slug) return;
    void getPublicBarbershop(slug)
      .then((barbershop) => {
        if (active) setBarbershopName(barbershop.name);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [slug]);

  const redeemAccess = useCallback(async () => {
    if (!user || !token || !slug || code.length !== 8 || isRedeeming) return;

    setRedeeming(true);
    setError(null);
    try {
      await redeemBarbershopAccess(slug, code, token);
      await enterCustomerMode();
      router.replace({ pathname: '/barbers/[slug]', params: { slug } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Erişim kodu doğrulanamadı.');
    } finally {
      setRedeeming(false);
    }
  }, [code, enterCustomerMode, isRedeeming, router, slug, token, user]);

  useEffect(() => {
    if (!user || !token || attemptedKey.current === attemptKey) return;
    attemptedKey.current = attemptKey;
    void redeemAccess();
  }, [attemptKey, redeemAccess, token, user]);

  const authParams = { accessCode: code, accessSlug: slug };
  const linkIsValid = Boolean(slug && code.length === 8);

  return (
    <Screen>
      <View style={styles.content}>
        <TrimlyLogo style={styles.logo} />
        <AppCard style={styles.card}>
          <View style={styles.iconShell}>
            <SymbolView
              name={{ ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' }}
              size={34}
              tintColor={colors.primary}
            />
          </View>
          <AppText style={styles.title} variant="displayMedium">
            {barbershopName ? `${barbershopName} daveti` : 'Özel işletme daveti'}
          </AppText>

          {!linkIsValid ? (
            <>
              <AppText color="danger" style={styles.description}>
                Bu QR veya davet bağlantısı eksik ya da geçersiz.
              </AppText>
              <View style={styles.action}>
                <AppButton onPress={() => router.replace('/')} variant="secondary">
                  Ana Sayfaya Dön
                </AppButton>
              </View>
            </>
          ) : !user ? (
            <>
              <AppText color="textMuted" style={styles.description}>
                İşletmeye erişimini güvenle kaydetmek için önce Trimly hesabına giriş yap.
              </AppText>
              <View style={styles.action}>
                <AppButton
                  onPress={() => router.push({ pathname: '/auth/login', params: authParams })}>
                  Giriş Yap ve Devam Et
                </AppButton>
              </View>
              <View style={styles.secondaryAction}>
                <AppButton
                  onPress={() => router.push({ pathname: '/auth/register', params: authParams })}
                  variant="secondary">
                  Hesap Oluştur
                </AppButton>
              </View>
            </>
          ) : (
            <>
              {isRedeeming ? (
                <>
                  <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
                  <AppText color="textMuted" style={styles.description}>
                    İşletme erişimin açılıyor…
                  </AppText>
                </>
              ) : error ? (
                <>
                  <AppText color="danger" style={styles.description}>{error}</AppText>
                  <View style={styles.action}>
                    <AppButton onPress={() => void redeemAccess()}>Tekrar Dene</AppButton>
                  </View>
                </>
              ) : null}
            </>
          )}
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  logo: { alignSelf: 'center', marginBottom: spacing.xxl },
  card: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  title: { fontSize: 24, lineHeight: 31, marginTop: spacing.lg, textAlign: 'center' },
  description: { lineHeight: 21, marginTop: spacing.sm, textAlign: 'center' },
  action: { marginTop: spacing.xl, width: '100%' },
  secondaryAction: { marginTop: spacing.sm, width: '100%' },
  loader: { marginTop: spacing.xl },
});
