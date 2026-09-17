import { useState } from 'react';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { AppointmentReview } from '@/features/appointments/types';
import {
  removeAppointmentReview,
  removeAppointmentReviewPhoto,
  saveAppointmentReview,
  uploadAppointmentReviewPhoto,
} from '@/features/reviews/api';
import { resolveApiUrl } from '@/lib/api/client';
import { colors } from '@/theme/colors';
import { fontFamily } from '@/theme/typography';
import { radius, spacing } from '@/theme/spacing';

type LocalReviewPhoto = {
  id: string;
  mimeType?: string | null;
  uri: string;
};

export function AppointmentReviewEditor({
  accessToken,
  appointmentId,
  onChanged,
  review,
}: {
  accessToken: string;
  appointmentId: string;
  onChanged: () => Promise<void>;
  review: AppointmentReview | null;
}) {
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [comment, setComment] = useState(review?.comment ?? '');
  const [pendingPhotos, setPendingPhotos] = useState<LocalReviewPhoto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [removingPhotoId, setRemovingPhotoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remainingPhotoCount = Math.max(
    0,
    3 - (review?.photos.length ?? 0) - pendingPhotos.length,
  );

  async function selectPhotos() {
    if (!remainingPhotoCount) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 0.85,
      selectionLimit: remainingPhotoCount,
    });
    if (result.canceled) return;

    const supported = result.assets.filter(
      ({ mimeType }) =>
        !mimeType ||
        mimeType === 'image/jpeg' ||
        mimeType === 'image/png' ||
        mimeType === 'image/webp',
    );
    if (supported.length !== result.assets.length) {
      setError('Yalnız JPEG, PNG veya WebP fotoğraf seçebilirsin.');
    } else {
      setError(null);
    }
    setPendingPhotos((current) => [
      ...current,
      ...supported.slice(0, remainingPhotoCount).map((photo, index) => ({
        id: `${photo.assetId ?? photo.uri}-${index}`,
        mimeType: photo.mimeType,
        uri: photo.uri,
      })),
    ]);
  }

  async function save() {
    if (!rating || isSaving) {
      if (!rating) setError('Önce 1 ile 5 arasında bir puan seçmelisin.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveAppointmentReview(
        appointmentId,
        { rating, comment: comment.trim() },
        accessToken,
      );
      for (const photo of pendingPhotos) {
        await uploadAppointmentReviewPhoto(appointmentId, photo, accessToken);
      }
      setPendingPhotos([]);
      await onChanged();
      Alert.alert('Teşekkürler', 'Değerlendirmen işletme profilinde yayınlandı.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Yorum kaydedilemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  function confirmRemovePhoto(photoId: string) {
    Alert.alert('Fotoğrafı kaldır', 'Bu fotoğraf yorumundan kaldırılacak.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Kaldır',
        style: 'destructive',
        onPress: () => void removePhoto(photoId),
      },
    ]);
  }

  async function removePhoto(photoId: string) {
    if (removingPhotoId) return;
    setRemovingPhotoId(photoId);
    setError(null);
    try {
      await removeAppointmentReviewPhoto(appointmentId, photoId, accessToken);
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Fotoğraf kaldırılamadı.');
    } finally {
      setRemovingPhotoId(null);
    }
  }

  function confirmRemoveReview() {
    Alert.alert(
      'Yorumu sil',
      'Puanın, yorumun ve eklediğin yorum fotoğrafları kaldırılacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Yorumu Sil', style: 'destructive', onPress: () => void removeReview() },
      ],
    );
  }

  async function removeReview() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      await removeAppointmentReview(appointmentId, accessToken);
      await onChanged();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Yorum silinemedi.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View>
      <AppText style={styles.sectionTitle} variant="heading">
        Deneyimini Değerlendir
      </AppText>
      <AppCard style={styles.card}>
        <AppText variant="label">Bu randevu nasıldı?</AppText>
        <View accessibilityRole="radiogroup" style={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <Pressable
              accessibilityLabel={`${value} yıldız`}
              accessibilityRole="radio"
              accessibilityState={{ checked: rating === value }}
              key={value}
              onPress={() => setRating(value)}
              style={({ pressed }) => [styles.starButton, pressed && styles.pressed]}>
              <SymbolView
                name={{
                  ios: value <= rating ? 'star.fill' : 'star',
                  android: value <= rating ? 'star' : 'star_border',
                  web: value <= rating ? 'star' : 'star_border',
                }}
                size={29}
                tintColor={value <= rating ? colors.primary : colors.textMuted}
              />
            </Pressable>
          ))}
        </View>

        <TextInput
          maxLength={1000}
          multiline
          onChangeText={setComment}
          placeholder="Deneyimini anlatmak ister misin? (isteğe bağlı)"
          placeholderTextColor={colors.textMuted}
          style={styles.commentInput}
          textAlignVertical="top"
          value={comment}
        />
        <AppText color="textMuted" style={styles.counter} variant="bodySmall">
          {comment.length}/1000
        </AppText>

        {review?.photos.length || pendingPhotos.length ? (
          <ScrollView
            contentContainerStyle={styles.photos}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {review?.photos.map((photo) => (
              <View key={photo.id} style={styles.photoShell}>
                <Image
                  contentFit="cover"
                  source={resolveApiUrl(photo.url)}
                  style={styles.photo}
                />
                <Pressable
                  accessibilityLabel="Yorum fotoğrafını kaldır"
                  disabled={removingPhotoId === photo.id}
                  onPress={() => confirmRemovePhoto(photo.id)}
                  style={styles.removeButton}>
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={13}
                    tintColor={colors.onPrimary}
                  />
                </Pressable>
              </View>
            ))}
            {pendingPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoShell}>
                <Image contentFit="cover" source={photo.uri} style={styles.photo} />
                <Pressable
                  accessibilityLabel="Seçilen fotoğrafı kaldır"
                  onPress={() =>
                    setPendingPhotos((current) =>
                      current.filter(({ id }) => id !== photo.id),
                    )
                  }
                  style={styles.removeButton}>
                  <SymbolView
                    name={{ ios: 'xmark', android: 'close', web: 'close' }}
                    size={13}
                    tintColor={colors.onPrimary}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
        ) : null}

        {remainingPhotoCount ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void selectPhotos()}
            style={({ pressed }) => [styles.photoPicker, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'photo.badge.plus', android: 'add_photo_alternate', web: 'add_photo_alternate' }}
              size={20}
              tintColor={colors.primary}
            />
            <AppText color="primary" variant="label">
              Fotoğraf Ekle ({remainingPhotoCount} hakkın kaldı)
            </AppText>
          </Pressable>
        ) : null}

        {error ? <AppText color="danger" style={styles.error} variant="bodySmall">{error}</AppText> : null}
        <View style={styles.saveButton}>
          <AppButton disabled={isSaving} onPress={() => void save()}>
            {isSaving ? 'Kaydediliyor…' : review ? 'Yorumu Güncelle' : 'Yorumu Yayınla'}
          </AppButton>
        </View>
        {review ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={confirmRemoveReview}
            style={({ pressed }) => [styles.deleteReview, pressed && styles.pressed]}>
            <AppText color="danger" variant="label">Yorumu Sil</AppText>
          </Pressable>
        ) : null}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  card: { padding: spacing.md },
  stars: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  starButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  commentInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.md,
    minHeight: 104,
    padding: spacing.sm,
  },
  counter: { marginTop: spacing.xxs, textAlign: 'right' },
  photos: { gap: spacing.xs, paddingTop: spacing.sm },
  photoShell: { borderRadius: radius.md, height: 94, overflow: 'hidden', width: 94 },
  photo: { height: '100%', width: '100%' },
  removeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.78)',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 28,
  },
  photoPicker: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 48,
  },
  error: { marginTop: spacing.sm },
  saveButton: { marginTop: spacing.md },
  deleteReview: { alignItems: 'center', paddingTop: spacing.md },
  pressed: { opacity: 0.72 },
});
