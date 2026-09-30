import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { AppButton } from './AppButton';
import { AppText } from './AppText';

export function UnsavedChangesSheet({
  description,
  isSaving,
  onContinue,
  onDiscard,
  onSave,
  visible,
}: {
  description: string;
  isSaving: boolean;
  onContinue: () => void;
  onDiscard: () => void;
  onSave: () => void;
  visible: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onContinue}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Düzenlemeye devam et"
          accessibilityRole="button"
          disabled={isSaving}
          onPress={onContinue}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText style={styles.title} variant="sectionTitle">
            Kaydedilmemiş değişiklikler
          </AppText>
          <AppText color="textMuted" style={styles.description} variant="body">
            {description}
          </AppText>

          <View style={styles.actions}>
            <AppButton disabled={isSaving} onPress={onSave}>
              {isSaving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
            </AppButton>
            <AppButton disabled={isSaving} onPress={onContinue} variant="secondary">
              Düzenlemeye Devam Et
            </AppButton>
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={onDiscard}
              style={({ pressed }) => [
                styles.discardButton,
                { borderColor: colors.danger },
                pressed && styles.pressed,
                isSaving && styles.disabled,
              ]}>
              <AppText color="danger" variant="label">
                Değişiklikleri Sil
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(18, 14, 11, 0.52)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.lg,
    width: 44,
  },
  title: { textAlign: 'center' },
  description: {
    lineHeight: 22,
    marginHorizontal: spacing.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  actions: { gap: spacing.xs, marginTop: spacing.lg },
  discardButton: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
