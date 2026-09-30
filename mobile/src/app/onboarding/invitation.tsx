import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { acceptBusinessInvitation } from '@/features/members/api';
import { spacing } from '@/theme/spacing';

export default function InvitationOnboardingScreen() {
  const router = useRouter();
  const { source, token: invitationToken } = useLocalSearchParams<{
    source?: string;
    token?: string;
  }>();
  const { refreshUser, token } = useAuth();
  const [invitation, setInvitation] = useState(invitationToken ?? '');
  const [joinedBusiness, setJoinedBusiness] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  function goBack() {
    if (source === 'profile' || source === 'business-select' || source === 'profiles') {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace(
        source === 'profile'
          ? '/(tabs)/profile'
          : source === 'profiles'
            ? '/profiles'
            : '/business/select',
      );
      return;
    }

    router.replace('/(tabs)');
  }

  async function submit() {
    if (!token) return;
    const invitationToken = extractInvitationToken(invitation);
    if (!invitationToken) {
      setError('İşletme sahibinden aldığın davet kodunu veya bağlantıyı gir.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const membership = await acceptBusinessInvitation(invitationToken, token);
      await refreshUser();
      setJoinedBusiness(membership.barbershop.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davete katılınamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  if (joinedBusiness) {
    return (
      <AuthScreenLayout
        description="Rolün daveti gönderen işletme tarafından belirlendi; kendine yetki vermedin."
        title="Ekibe Katıldın"
        titleVariant="pageTitle">
        <AppCard style={styles.successCard}>
          <AppText color="primary" variant="overline">DAVET KABUL EDİLDİ</AppText>
          <AppText style={styles.successName} variant="heading">{joinedBusiness}</AppText>
          <AppText color="textMuted">
            İşletme üyeliğin hesabına eklendi. Artık yetkilerine uygun işletme ekranlarını kullanabilirsin.
          </AppText>
        </AppCard>
        <View style={styles.action}>
          <AppButton onPress={() => router.replace('/profiles')}>
            Profillerimi Gör
          </AppButton>
        </View>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      description="İşletme sahibinin gönderdiği davet bağlantısını veya içindeki kodu kullan."
      onBackPress={goBack}
      title="Ekibe Katıl"
      titleVariant="pageTitle">
      <AppCard style={styles.formCard}>
        <AuthTextField
          autoCapitalize="none"
          autoCorrect={false}
          icon={{ ios: 'ticket', android: 'confirmation_number', web: 'confirmation_number' }}
          label="Davet kodu veya bağlantısı"
          onChangeText={setInvitation}
          onSubmitEditing={() => void submit()}
          placeholder="trimly.app/join/..."
          returnKeyType="done"
          value={invitation}
        />
        <AppText color="textMuted" style={styles.hint} variant="bodySmall">
          Berber, yönetici veya çırak rolünü sen seçmezsin; güvenlik için rol davetin içinde gelir.
        </AppText>
        {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
        <View style={styles.action}>
          <AppButton disabled={isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'Davet kontrol ediliyor…' : 'Daveti Kabul Et'}
          </AppButton>
        </View>
      </AppCard>
      <AppText color="textMuted" style={styles.invitationNote} variant="bodySmall">
        Davet kodun yoksa işletme sahibinden senin rolüne özel bir davet oluşturmasını iste.
      </AppText>
    </AuthScreenLayout>
  );
}

function extractInvitationToken(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.split('/').at(-1) ?? '';
}

const styles = StyleSheet.create({
  formCard: { marginTop: spacing.xl, padding: spacing.lg },
  hint: { lineHeight: 18, marginTop: spacing.md },
  error: { marginTop: spacing.md },
  action: { marginTop: spacing.xl },
  successCard: { marginTop: spacing.xl, padding: spacing.xl },
  successName: { marginBottom: spacing.sm, marginTop: spacing.xs },
  invitationNote: { lineHeight: 19, marginTop: spacing.md, textAlign: 'center' },
});
