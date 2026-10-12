import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessCancellationAppealSheet({
  isSubmitting,
  onClose,
  onSubmit,
  visible,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  visible: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');

  const trimmedReason = reason.trim();

  return (
    <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="İtiraz formunu kapat"
          accessibilityRole="button"
          disabled={isSubmitting}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <AppText variant="sectionTitle">İptal kaydına itiraz et</AppText>
          <AppText color="textMuted" style={styles.description} variant="bodySmall">
            Mücbir sebep, platform arızası veya kayıt hatası varsa açıklamanı yaz. İtiraz
            incelenirken mevcut kısıtlar devam eder. Bu kayıt için bir kez başvurabilirsin.
          </AppText>
          <TextInput
            accessibilityLabel="İtiraz açıklaması"
            editable={!isSubmitting}
            maxLength={1000}
            multiline
            onChangeText={setReason}
            placeholder="Olayı ve varsa doğrulanabilecek ayrıntıları yaz…"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            textAlignVertical="top"
            value={reason}
          />
          <AppText color="textMuted" style={styles.counter} variant="bodySmall">
            {reason.length}/1000
          </AppText>
          <View style={styles.actions}>
            <AppButton disabled={isSubmitting} onPress={onClose} variant="secondary">
              Vazgeç
            </AppButton>
            <AppButton
              disabled={isSubmitting || trimmedReason.length < 10}
              onPress={() => onSubmit(trimmedReason)}
            >
              {isSubmitting ? 'Gönderiliyor…' : 'İncelemeye Gönder'}
            </AppButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(18, 14, 11, 0.55)',
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
  description: { lineHeight: 19, marginTop: spacing.xs },
  input: {
    borderRadius: radius.smallCard,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.md,
    minHeight: 116,
    padding: spacing.md,
  },
  counter: { marginTop: spacing.xxs, textAlign: 'right' },
  actions: { gap: spacing.xs, marginTop: spacing.md },
});
