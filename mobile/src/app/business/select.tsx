import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessMembershipCard } from '@/features/business/components/BusinessMembershipCard';
import { spacing } from '@/theme/spacing';

export default function BusinessSelectionScreen() {
  const router = useRouter();
  const { continueToBusiness } = useLocalSearchParams<{ continueToBusiness?: string }>();
  const { enterBusinessMode } = useAppMode();
  const { activeMembership, memberships, selectMembership } = useBusiness();
  const [pendingMembershipId, setPendingMembershipId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const selectedMembershipId = pendingMembershipId ?? activeMembership?.id ?? null;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  async function saveSelection() {
    if (!selectedMembershipId) {
      setError('Devam etmek için bir işletme seç.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      if (continueToBusiness === 'true') {
        await enterBusinessMode(selectedMembershipId);
        router.replace('/(business)');
      } else {
        await selectMembership(selectedMembershipId);
        goBack();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'İşletme seçilemedi.');
    } finally {
      setSaving(false);
    }
  }

  if (memberships.length === 0) {
    return (
      <AuthScreenLayout
        description="İşletme modunu kullanabilmek için bir işletme oluşturmalı veya çalışan daveti kabul etmelisin."
        onBackPress={goBack}
        title="Henüz işletmen yok.">
        <AppCard style={styles.emptyCard}>
          <AppText variant="heading">İşletme tarafına geçmeye hazırsan</AppText>
          <AppText color="textMuted" style={styles.emptyDescription}>
            Kendi salonunu oluşturabilir ya da işletme sahibinin gönderdiği davetle ekibe katılabilirsin.
          </AppText>
          <View style={styles.action}>
            <AppButton
              onPress={() => router.push({
                pathname: '/onboarding/business',
                params: { source: 'business-select' },
              })}>
              İşletme Oluştur
            </AppButton>
          </View>
          <AppButton
            onPress={() => router.push({
              pathname: '/onboarding/invitation',
              params: { source: 'business-select' },
            })}
            variant="ghost">
            Çalışan Davetine Katıl
          </AppButton>
        </AppCard>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      description="İşletme ekranlarında hangi salonun verileriyle çalışacağını seç."
      onBackPress={goBack}
      title="Aktif işletmen.">
      <View accessibilityRole="radiogroup" style={styles.list}>
        {memberships.map((membership) => (
          <BusinessMembershipCard
            isSelected={selectedMembershipId === membership.id}
            key={membership.id}
            membership={membership}
            onPress={() => {
              setPendingMembershipId(membership.id);
              setError(null);
            }}
          />
        ))}
      </View>

      {memberships.length === 1 ? (
        <AppText color="textMuted" style={styles.note} variant="bodySmall">
          Tek üyeliğin olduğu için bu işletme otomatik seçilir.
        </AppText>
      ) : (
        <AppText color="textMuted" style={styles.note} variant="bodySmall">
          Bu seçim yalnızca uygulamada hangi işletmeyi görüntülediğini belirler; yetkilerin backend tarafından kontrol edilir.
        </AppText>
      )}

      {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
      <View style={styles.action}>
        <AppButton
          disabled={!selectedMembershipId || isSaving}
          onPress={() => void saveSelection()}>
          {isSaving ? 'Kaydediliyor…' : 'Seçimi Kaydet'}
        </AppButton>
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, marginTop: spacing.xl },
  note: { lineHeight: 18, marginTop: spacing.md },
  error: { marginTop: spacing.md },
  action: { marginTop: spacing.xl },
  emptyCard: { marginTop: spacing.xl, padding: spacing.xl },
  emptyDescription: { lineHeight: 21, marginTop: spacing.sm },
});
