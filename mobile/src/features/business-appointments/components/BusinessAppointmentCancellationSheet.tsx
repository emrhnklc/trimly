import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

const cancellationReasons = [
  'Çalışan müsait değil',
  'İşletme kapalı',
  'Teknik sorun',
  'Müşteri talebi',
] as const;

export function BusinessAppointmentCancellationSheet({
  customerName,
  isSubmitting,
  onClose,
  onSubmit,
  visible,
}: {
  customerName: string;
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
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="İptal açıklamasını kapat"
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
          <AppText variant="sectionTitle">İptal nedenini açıkla</AppText>
          <AppText color="textMuted" style={styles.description} variant="bodySmall">
            {customerName} için olan randevu iptal edilecek ve bu açıklama müşteriye gösterilecek.
          </AppText>

          <ScrollView
            contentContainerStyle={styles.reasonList}
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            {cancellationReasons.map((item) => {
              const selected = reason === item;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => setReason(item)}
                  style={({ pressed }) => [
                    styles.reasonChip,
                    {
                      backgroundColor: selected ? colors.primary : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText color={selected ? 'onPrimary' : 'text'} variant="bodySmall">
                    {item}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <TextInput
            editable={!isSubmitting}
            maxLength={500}
            multiline
            onChangeText={setReason}
            placeholder="İptal nedenini yaz…"
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
            {reason.length}/500
          </AppText>

          <View style={styles.actions}>
            <AppButton disabled={isSubmitting} onPress={onClose} variant="secondary">
              Vazgeç
            </AppButton>
            <AppButton
              disabled={isSubmitting || trimmedReason.length < 3}
              onPress={() => onSubmit(trimmedReason)}
            >
              {isSubmitting ? 'İptal ediliyor…' : 'Randevuyu İptal Et'}
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
  reasonList: { gap: spacing.xs, paddingRight: spacing.lg },
  reasonChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    borderRadius: radius.smallCard,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.md,
    minHeight: 100,
    padding: spacing.md,
  },
  counter: { marginTop: spacing.xxs, textAlign: 'right' },
  actions: { gap: spacing.xs, marginTop: spacing.md },
  pressed: { opacity: 0.72 },
});
