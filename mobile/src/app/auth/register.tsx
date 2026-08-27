import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { register } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { spacing } from '@/theme/spacing';

export default function RegisterScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/auth/login');
  }

  async function submit() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Ad, soyad, e-posta ve şifre zorunludur.');
      return;
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await signIn(await register({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      }));
      router.replace('/');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Hesap oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreenLayout
      description="Birkaç bilgiyle hesabını aç; favorilerin ve randevu geçmişin hep seninle kalsın."
      onBackPress={goBack}
      title="Trimly’ye katıl.">
      <AppCard style={styles.formCard}>
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <AuthTextField
              autoComplete="given-name"
              icon={{ ios: 'person', android: 'person', web: 'person' }}
              label="Ad"
              onChangeText={setFirstName}
              placeholder="Adın"
              value={firstName}
            />
          </View>
          <View style={styles.nameField}>
            <AuthTextField
              autoComplete="family-name"
              icon={{ ios: 'person', android: 'person', web: 'person' }}
              label="Soyad"
              onChangeText={setLastName}
              placeholder="Soyadın"
              value={lastName}
            />
          </View>
        </View>
        <AuthTextField
          autoCapitalize="none"
          autoComplete="email"
          icon={{ ios: 'envelope', android: 'mail', web: 'mail' }}
          keyboardType="email-address"
          label="E-posta"
          onChangeText={setEmail}
          placeholder="ornek@mail.com"
          value={email}
        />
        <AuthTextField
          autoComplete="tel"
          icon={{ ios: 'phone', android: 'phone', web: 'phone' }}
          keyboardType="phone-pad"
          label="Telefon (isteğe bağlı)"
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          value={phone}
        />
        <AuthTextField
          autoComplete="new-password"
          icon={{ ios: 'lock', android: 'lock', web: 'lock' }}
          label="Şifre"
          onChangeText={setPassword}
          placeholder="En az 8 karakter"
          secureTextEntry
          value={password}
        />
        <AuthTextField
          autoComplete="new-password"
          icon={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }}
          label="Şifreyi doğrula"
          onChangeText={setPasswordConfirmation}
          onSubmitEditing={() => void submit()}
          placeholder="Şifreni tekrar yaz"
          returnKeyType="done"
          secureTextEntry
          value={passwordConfirmation}
        />
        {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
        <AppText color="textMuted" style={styles.legal} variant="bodySmall">
          Hesap oluşturarak Trimly’nin kullanım ve gizlilik koşullarını kabul etmiş olursun.
        </AppText>
        <View style={styles.action}>
          <AppButton disabled={isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'Hesabın hazırlanıyor…' : 'Hesap Oluştur'}
          </AppButton>
        </View>
      </AppCard>

      <View style={styles.footer}>
        <AppText color="textMuted">Zaten hesabın var mı?</AppText>
        <AppButton disabled={isSubmitting} onPress={() => router.replace('/auth/login')} variant="ghost">
          Giriş Yap
        </AppButton>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  formCard: { marginTop: spacing.xl, padding: spacing.lg },
  nameRow: { flexDirection: 'row', gap: spacing.sm },
  nameField: { flex: 1 },
  error: { marginTop: spacing.md },
  legal: { marginTop: spacing.lg },
  action: { marginTop: spacing.lg },
  footer: { alignItems: 'center', marginTop: spacing.lg },
});
