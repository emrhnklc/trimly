import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { BusinessAppointmentDetail } from '@/features/appointments/types';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { useThemeColors } from '@/theme/useThemeColors';

type BusinessHaircutRecordFormProps = {
  appointment: BusinessAppointmentDetail;
  canAddPhoto: boolean;
  error: string | null;
  isSaved: boolean;
  isSubmitting: boolean;
  notes: string;
  onChangeNotes: (value: string) => void;
  onChangeStyleName: (value: string) => void;
  onAddPhoto: () => void;
  onSubmit: () => void;
  styleName: string;
};

export function BusinessHaircutRecordForm({
  appointment,
  canAddPhoto,
  error,
  isSaved,
  isSubmitting,
  notes,
  onChangeNotes,
  onChangeStyleName,
  onAddPhoto,
  onSubmit,
  styleName,
}: BusinessHaircutRecordFormProps) {
  const themeColors = useThemeColors();
  const photoCount = appointment.haircutRecord?.photos.length ?? 0;

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <AppCard style={styles.summaryCard}>
        <View style={[styles.summaryIcon, { backgroundColor: themeColors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
            size={23}
            tintColor={themeColors.primary}
          />
        </View>
        <View style={styles.summaryCopy}>
          <AppText variant="heading">
            {appointment.attendeeNameSnapshot}
          </AppText>
          <AppText color="textMuted" style={styles.summaryService} variant="bodySmall">
            {appointment.serviceNameSnapshot} · {appointment.durationMinutes} dk
          </AppText>
        </View>
      </AppCard>

      <AppText style={styles.introTitle} variant="heading">
        Bu tıraşı hatırlanabilir yap
      </AppText>
      <AppText color="textMuted" style={styles.introText} variant="bodySmall">
        Model ve uygulama notları, müşterinin sonraki ziyaretinde aynı sonucu yakalamana yardım eder.
      </AppText>

      <AppText style={styles.fieldLabel} variant="label">Model / stil adı</AppText>
      <TextInput
        accessibilityLabel="Model veya stil adı"
        autoCapitalize="words"
        maxLength={100}
        onChangeText={onChangeStyleName}
        placeholder="Örn. Low fade, klasik kesim"
        placeholderTextColor={themeColors.textMuted}
        style={[styles.input, { backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }]}
        value={styleName}
      />

      <AppText style={styles.fieldLabel} variant="label">Berber notu</AppText>
      <TextInput
        accessibilityLabel="Tıraş notu"
        maxLength={2000}
        multiline
        onChangeText={onChangeNotes}
        placeholder="Geçiş numarası, üst uzunluğu, müşterinin tercihi…"
        placeholderTextColor={themeColors.textMuted}
        style={[styles.input, styles.notesInput, { backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }]}
        textAlignVertical="top"
        value={notes}
      />
      <AppText color="textMuted" style={styles.counter} variant="bodySmall">
        {notes.length}/2000
      </AppText>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: themeColors.dangerSurface }]}>
          <AppText color="danger" variant="bodySmall">{error}</AppText>
        </View>
      ) : null}

      <View style={styles.submitButton}>
        <AppButton disabled={isSubmitting} onPress={onSubmit}>
          {isSubmitting
            ? 'Kaydediliyor…'
            : appointment.status === 'COMPLETED'
              ? 'Notları Güncelle'
              : 'Tıraşı Tamamla ve Devam Et'}
        </AppButton>
      </View>

      {isSaved ? (
        <View style={[styles.photoSuccessCard, { backgroundColor: themeColors.surfaceMuted }]}>
          <View style={[styles.photoSuccessIcon, { backgroundColor: themeColors.surface }]}>
            <SymbolView
              name={{ ios: 'camera', android: 'photo_camera', web: 'photo_camera' }}
              size={20}
              tintColor={themeColors.primary}
            />
          </View>
          <View style={styles.photoSuccessCopy}>
            <AppText variant="label">Randevu tamamlandı · {photoCount}/8 fotoğraf</AppText>
            <AppText color="textMuted" variant="bodySmall">
              {canAddPhoto
                ? 'Müşteri izin verirse sonucu farklı açılardan fotoğraflayabilirsin.'
                : 'Fotoğraf ekleme süresi doldu; notları güncellemeye devam edebilirsin.'}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={!canAddPhoto || photoCount >= 8}
            onPress={onAddPhoto}
            style={({ pressed }) => [styles.photoAddButton, { backgroundColor: themeColors.surface }, pressed && styles.pressed]}>
            <AppText color="primary" variant="label">
              {photoCount >= 8
                ? 'Sınır Doldu'
                : canAddPhoto
                  ? 'Fotoğraf Ekle'
                  : 'Süre Doldu'}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  summaryCard: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.md },
  summaryIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  summaryCopy: { flex: 1, marginLeft: spacing.sm },
  summaryService: { marginTop: 2 },
  introTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 27,
    marginTop: spacing.xl,
  },
  introText: { lineHeight: 20, marginTop: spacing.xs },
  fieldLabel: { marginBottom: spacing.xs, marginTop: spacing.lg },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontFamily: fontFamily.body,
    fontSize: 14,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notesInput: { minHeight: 126 },
  counter: { marginTop: 4, textAlign: 'right' },
  errorBox: {
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  submitButton: { marginTop: spacing.xl },
  photoSuccessCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    flexDirection: 'row',
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  photoSuccessIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  photoSuccessCopy: { flex: 1, marginHorizontal: spacing.sm, minWidth: 0 },
  photoAddButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  pressed: { opacity: 0.68 },
});
