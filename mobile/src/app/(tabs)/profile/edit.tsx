import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { updateMyProfile } from '@/features/auth/api';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function EditProfileScreen() {
  const router = useRouter();
  const { token, updateUser, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user || !token) return null;

  const previewUrl = profileImageUrl.trim();
  const canPreviewImage = /^https?:\/\//i.test(previewUrl);

  async function saveProfile() {
    if (!token) return;

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError('Ad ve soyad boş bırakılamaz.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updatedUser = await updateMyProfile(
        {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          phone: phone.trim(),
          ...(previewUrl ? { profileImageUrl: previewUrl } : {}),
        },
        token,
      );
      await updateUser(updatedUser);
      router.back();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Profil güncellenemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <AppIconButton
            accessibilityLabel="Profile geri dön"
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            onPress={() => router.back()}
            variant="transparent"
          />
          <AppText style={styles.title} variant="displayMedium">Profili Düzenle</AppText>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.avatarArea}>
          {canPreviewImage ? (
            <Image
              accessibilityLabel="Profil fotoğrafı önizlemesi"
              contentFit="cover"
              source={previewUrl}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText color="primary" style={styles.initial} variant="displayLarge">
                {firstName.slice(0, 1).toUpperCase() || '?'}
              </AppText>
            </View>
          )}
          <AppText color="textMuted" style={styles.photoHint} variant="bodySmall">
            Şimdilik fotoğraf bağlantısı kullanıyoruz; cihazdan yüklemeyi sonraki adımda ekleyeceğiz.
          </AppText>
        </View>

        <AppCard style={styles.formCard}>
          <AuthTextField
            autoCapitalize="words"
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            label="Ad"
            onChangeText={setFirstName}
            placeholder="Adın"
            value={firstName}
          />
          <AuthTextField
            autoCapitalize="words"
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            label="Soyad"
            onChangeText={setLastName}
            placeholder="Soyadın"
            value={lastName}
          />
          <AuthTextField
            icon={{ ios: 'phone', android: 'phone', web: 'phone' }}
            keyboardType="phone-pad"
            label="Telefon"
            onChangeText={setPhone}
            placeholder="+90 5xx xxx xx xx"
            value={phone}
          />
          <AuthTextField
            autoCapitalize="none"
            autoCorrect={false}
            icon={{ ios: 'photo', android: 'image', web: 'image' }}
            keyboardType="url"
            label="Profil Fotoğrafı URL"
            onChangeText={setProfileImageUrl}
            placeholder="https://..."
            value={profileImageUrl}
          />

          {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
          <View style={styles.saveButton}>
            <AppButton disabled={isSaving} onPress={() => void saveProfile()}>
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </AppButton>
          </View>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  topBarSpacer: { width: 44 },
  title: { flex: 1, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  avatarArea: { alignItems: 'center', marginTop: spacing.xl },
  avatar: { borderRadius: radius.pill, height: 112, width: 112 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  initial: { fontSize: 42, lineHeight: 48 },
  photoHint: { marginTop: spacing.sm, maxWidth: 320, textAlign: 'center' },
  formCard: { marginTop: spacing.xl },
  error: { marginTop: spacing.md, textAlign: 'center' },
  saveButton: { marginTop: spacing.lg },
});
