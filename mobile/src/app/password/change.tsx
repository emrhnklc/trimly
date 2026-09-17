import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { requestPasswordReset, resetPassword } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { PasswordRequirements } from '@/features/auth/components/PasswordRequirements';
import { isStrongPassword } from '@/features/auth/validation';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [code, setCode] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [step, setStep] = useState<'send' | 'verify'>('send');

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((current) => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  if (!user) return null;
  const email = user.email;

  async function sendCode() {
    if (isSubmitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await requestPasswordReset(email);
      setDevCode(result.devResetCode ?? null);
      setCooldownSeconds(60);
      setStep('verify');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kod gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  async function saveNewPassword() {
    if (code.length !== 6) {
      setError('E-postana gelen 6 haneli kodu girmelisin.');
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError('Yeni şifren tüm güvenlik şartlarını karşılamalıdır.');
      return;
    }
    if (newPassword !== passwordConfirmation) {
      setError('Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(email, code, newPassword);
      await signOut();
      router.replace({ pathname: '/auth/login', params: { email, passwordReset: 'true' } });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Şifre değiştirilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title="Şifre Değiştir" />

        <View style={styles.intro}>
          <View style={styles.iconShell}>
            <SymbolView name={{ ios: 'lock.rotation', android: 'lock_reset', web: 'lock_reset' }} size={28} tintColor={colors.primary} />
          </View>
          <AppText style={styles.introTitle} variant="heading">E-postayla doğrula</AppText>
          <AppText color="textMuted" style={styles.introCopy} variant="bodySmall">
            Güvenliğin için doğrulama kodunu kayıtlı e-posta adresine göndereceğiz.
          </AppText>
        </View>

        <AppCard style={styles.card}>
          {step === 'send' ? (
            <>
              <AppText color="textMuted" style={styles.email} variant="label">{user.email}</AppText>
              {error ? <AppText color="danger" style={styles.message} variant="bodySmall">{error}</AppText> : null}
              <View style={styles.action}>
                <AppButton disabled={isSubmitting} onPress={() => void sendCode()}>
                  {isSubmitting ? 'Kod gönderiliyor…' : 'Doğrulama Kodu Gönder'}
                </AppButton>
              </View>
            </>
          ) : (
            <>
              <AuthTextField autoComplete="one-time-code" icon={{ ios: 'number', android: 'pin', web: 'pin' }} keyboardType="number-pad" label="6 haneli kod" maxLength={6} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" value={code} />
              {devCode ? (
                <View style={styles.developmentCode}>
                  <AppText color="textMuted" variant="bodySmall">Local geliştirme kodu</AppText>
                  <AppText selectable color="primary" variant="heading">{devCode}</AppText>
                </View>
              ) : null}
              <AuthTextField autoComplete="new-password" icon={{ ios: 'lock', android: 'lock', web: 'lock' }} label="Yeni şifre" onChangeText={setNewPassword} placeholder="En az 8 karakter" secureTextEntry value={newPassword} />
              <AuthTextField autoComplete="new-password" icon={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }} label="Yeni şifreyi doğrula" onChangeText={setPasswordConfirmation} onSubmitEditing={() => void saveNewPassword()} placeholder="Şifreni tekrar yaz" returnKeyType="done" secureTextEntry value={passwordConfirmation} />
              <PasswordRequirements confirmation={passwordConfirmation} password={newPassword} />
              {error ? <AppText color="danger" style={styles.message} variant="bodySmall">{error}</AppText> : null}
              <View style={styles.action}>
                <AppButton disabled={isSubmitting} onPress={() => void saveNewPassword()}>
                  {isSubmitting ? 'Şifre değiştiriliyor…' : 'Şifreyi Değiştir'}
                </AppButton>
              </View>
              <AppButton disabled={cooldownSeconds > 0 || isSubmitting} onPress={() => void sendCode()} variant="ghost">
                {cooldownSeconds > 0 ? `Kodu yeniden gönder (${cooldownSeconds} sn)` : 'Kodu yeniden gönder'}
              </AppButton>
            </>
          )}
        </AppCard>

        <AppText color="textMuted" style={styles.note} variant="bodySmall">
          Şifren değiştiğinde güvenlik için tüm cihazlardaki oturumların kapatılır.
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  intro: { alignItems: 'center', marginTop: spacing.lg },
  iconShell: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 58, justifyContent: 'center', width: 58 },
  introTitle: { marginTop: spacing.sm },
  introCopy: { marginTop: spacing.xs, maxWidth: 300, textAlign: 'center' },
  card: { marginTop: spacing.xl, padding: spacing.lg },
  email: { textAlign: 'center' },
  developmentCode: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, marginTop: spacing.sm, padding: spacing.sm },
  message: { marginTop: spacing.md },
  action: { marginTop: spacing.xl },
  note: { lineHeight: 19, marginTop: spacing.md, textAlign: 'center' },
});
