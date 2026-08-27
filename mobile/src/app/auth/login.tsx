import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { login } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { RememberMeToggle } from '@/features/auth/components/RememberMeToggle';
import { spacing } from '@/theme/spacing';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Giriş yapılamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      description="Randevularına, favorilerine ve tıraş geçmişine kaldığın yerden devam et."
      title="Tekrar hoş geldin.">
      <AppCard style={styles.formCard}>
        <AuthTextField
          autoCapitalize="none"
          autoComplete="email"
          icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
          keyboardType="email-address"
          label="E-posta"
          onChangeText={setEmail}
          placeholder="ornek@mail.com"
          returnKeyType="next"
          value={email}
        />
        <AuthTextField
          autoComplete="current-password"
          icon={{ ios: 'lock', android: 'lock', web: 'lock' }}
          label="Şifre"
          onChangeText={setPassword}
          onSubmitEditing={() => void submit()}
          placeholder="Şifren"
          returnKeyType="done"
          secureTextEntry
          value={password}
        />
        <RememberMeToggle onValueChange={setRememberMe} value={rememberMe} />
        {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
        <View style={styles.action}>
          <AppButton disabled={isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
          </AppButton>
        </View>
      </AppCard>

      <View style={styles.footer}>
        <AppText color="textMuted">Trimly’de yeni misin?</AppText>
        <AppButton disabled={isSubmitting} onPress={() => router.replace('/auth/register')} variant="ghost">
          Hesap Oluştur
        </AppButton>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formCard: { marginTop: spacing.xl, padding: spacing.lg },
  error: { marginTop: spacing.md },
  action: { marginTop: spacing.xl },
  footer: { alignItems: 'center', marginTop: spacing.lg },
});
