import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthScreenLayout } from '@/features/auth/components/AuthScreenLayout';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { createBarbershop } from '@/features/barbershops/api';
import { spacing } from '@/theme/spacing';

export default function BusinessOnboardingScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { refreshUser, token } = useAuth();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSlugEdited, setSlugEdited] = useState(false);
  const [createdName, setCreatedName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  function goBack() {
    if (source === 'profile' || source === 'business-select') {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace(source === 'profile' ? '/(tabs)/profile' : '/business/select');
      return;
    }

    router.replace('/(tabs)');
  }

  function changeName(value: string) {
    setName(value);
    if (!isSlugEdited) setSlug(createSlug(value));
  }

  async function submit() {
    if (!token) return;
    if (name.trim().length < 2) {
      setError('İşletme adı en az 2 karakter olmalıdır.');
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError('Özel bağlantı yalnızca küçük harf, sayı ve tire içerebilir.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await createBarbershop({
        name: name.trim(),
        slug,
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      }, token);
      await refreshUser();
      setCreatedName(created.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'İşletme oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  if (createdName) {
    return (
      <AuthScreenLayout
        description="OWNER üyeliğin gerçek veritabanında oluşturuldu. İşletme ayarlarını sonraki adımlarda birlikte tamamlayacağız."
        title="İşletmen hazır.">
        <AppCard style={styles.successCard}>
          <AppText color="primary" variant="overline">İŞLETME OLUŞTURULDU</AppText>
          <AppText style={styles.successName} variant="heading">{createdName}</AppText>
          <AppText color="textMuted">
            Artık bu işletmenin sahibisin. Hizmetler, çalışanlar ve çalışma saatleri bu üyeliğe bağlanacak.
          </AppText>
        </AppCard>
        <View style={styles.action}>
          <AppButton onPress={() => router.replace('/(tabs)')}>Ana Sayfaya Dön</AppButton>
        </View>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      description="Önce işletmenin temel kimliğini oluşturalım. Ayrıntıları daha sonra değiştirebilirsin."
      onBackPress={goBack}
      title="İşletmeni oluştur.">
      <AppCard style={styles.formCard}>
        <AuthTextField
          autoCapitalize="words"
          icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
          label="İşletme adı"
          onChangeText={changeName}
          placeholder="Örn. Trimly Barber"
          value={name}
        />
        <AuthTextField
          autoCapitalize="none"
          autoCorrect={false}
          icon={{ ios: 'link', android: 'link', web: 'link' }}
          label="Özel bağlantı"
          onChangeText={(value) => {
            setSlugEdited(true);
            setSlug(createSlug(value));
          }}
          placeholder="trimly-barber"
          value={slug}
        />
        <AppText color="textMuted" style={styles.hint} variant="bodySmall">
          Profil adresin: trimly.app/{slug || 'isletme-adi'}
        </AppText>
        <AuthTextField
          autoComplete="street-address"
          icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
          label="Adres (isteğe bağlı)"
          onChangeText={setAddress}
          placeholder="İlçe, şehir"
          value={address}
        />
        <AuthTextField
          autoComplete="tel"
          icon={{ ios: 'phone', android: 'phone', web: 'phone' }}
          keyboardType="phone-pad"
          label="İşletme telefonu (isteğe bağlı)"
          onChangeText={setPhone}
          placeholder="+90 5xx xxx xx xx"
          value={phone}
        />
        {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
        <View style={styles.action}>
          <AppButton disabled={isSubmitting} onPress={() => void submit()}>
            {isSubmitting ? 'İşletmen hazırlanıyor…' : 'İşletmeyi Oluştur'}
          </AppButton>
        </View>
      </AppCard>
      <AppButton disabled={isSubmitting} onPress={goBack} variant="ghost">
        Şimdilik Geç
      </AppButton>
    </AuthScreenLayout>
  );
}

function createSlug(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const styles = StyleSheet.create({
  formCard: { marginTop: spacing.xl, padding: spacing.lg },
  hint: { marginLeft: spacing.xs, marginTop: spacing.xs },
  error: { marginTop: spacing.md },
  action: { marginTop: spacing.xl },
  successCard: { marginTop: spacing.xl, padding: spacing.xl },
  successName: { marginBottom: spacing.sm, marginTop: spacing.xs },
});
