import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { login } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { LoginScreenLayout } from '@/features/auth/components/LoginScreenLayout';
import { LoginTextField } from '@/features/auth/components/LoginTextField';
import { RememberMeToggle } from '@/features/auth/components/RememberMeToggle';
import { SocialLoginButton } from '@/features/auth/components/SocialLoginButton';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { accessCode, accessSlug } = useLocalSearchParams<{
    accessCode?: string;
    accessSlug?: string;
  }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError('E-posta ve şifreni girmelisin.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await signIn(await login(email.trim(), password), rememberMe);
      if (accessSlug && accessCode) {
        router.replace({
          pathname: '/access/[slug]',
          params: { code: accessCode, slug: accessSlug },
        });
      } else {
        router.replace('/');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Giriş yapılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function showComingSoon(feature: string) {
    Alert.alert('Yakında', `${feature} sonraki auth aşamasında aktif olacak.`);
  }

  return (
    <LoginScreenLayout>
      <TrimlyLogo style={styles.logo} />

      <View style={styles.intro}>
        <AppText style={styles.title} variant="displayMedium">Tekrar hoş geldin</AppText>
        <AppText color="textMuted" style={styles.description}>
          Randevularına ve stil geçmişine eriş.
        </AppText>
      </View>

      <View style={styles.form}>
        <LoginTextField
          autoCapitalize="none"
          autoComplete="email"
          icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="E-posta"
          returnKeyType="next"
          value={email}
        />
        <LoginTextField
          autoComplete="current-password"
          icon={{ ios: 'lock', android: 'lock', web: 'lock' }}
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          onTrailingIconPress={() => setPasswordVisible((current) => !current)}
          placeholder="Şifre"
          returnKeyType="done"
          secureTextEntry={!isPasswordVisible}
          trailingIcon={isPasswordVisible
            ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
            : { ios: 'eye', android: 'visibility', web: 'visibility' }}
          trailingIconLabel={isPasswordVisible ? 'Şifreyi gizle' : 'Şifreyi göster'}
          value={password}
        />

        <View style={styles.optionsRow}>
          <RememberMeToggle onValueChange={setRememberMe} value={rememberMe} />
          <Pressable
            accessibilityRole="button"
            onPress={() => showComingSoon('Şifre yenileme')}
            style={({ pressed }) => pressed && styles.pressed}>
            <AppText color="primary" variant="bodySmall">Şifremi Unuttum</AppText>
          </Pressable>
        </View>

        {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}

        <View style={styles.primaryAction}>
          <AppButton disabled={isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </AppButton>
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={() => router.replace({
            pathname: '/auth/register',
            params: accessSlug && accessCode ? { accessCode, accessSlug } : {},
          })}
          style={({ pressed }) => [styles.registerAction, pressed && styles.pressed]}>
          <AppText color="textMuted" variant="bodySmall">Hesabın yok mu? </AppText>
          <AppText color="primary" variant="bodySmall">Kayıt Ol</AppText>
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <AppText color="textMuted" variant="bodySmall">veya</AppText>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <SocialLoginButton onPress={() => showComingSoon('Apple ile giriş')} provider="apple" />
          <SocialLoginButton onPress={() => showComingSoon('Google ile giriş')} provider="google" />
        </View>
      </View>

      <View style={styles.securityNote}>
        <SymbolView
          name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }}
          size={15}
          tintColor={colors.textMuted}
        />
        <AppText color="textMuted" variant="bodySmall">Bilgilerin güvenle korunur.</AppText>
      </View>
    </LoginScreenLayout>
  );
}

const styles = StyleSheet.create({
  logo: { marginTop: spacing.lg },
  intro: { alignItems: 'center', marginTop: spacing.xxl },
  title: { textAlign: 'center' },
  description: { marginTop: spacing.xs, textAlign: 'center' },
  form: { gap: spacing.sm, marginTop: spacing.xl },
  optionsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  error: { textAlign: 'center' },
  primaryAction: { marginTop: spacing.xs },
  registerAction: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  dividerLine: { backgroundColor: colors.border, flex: 1, height: 1 },
  socialRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xxl,
    maxWidth: 300,
  },
  securityNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
  pressed: { opacity: 0.65 },
});
