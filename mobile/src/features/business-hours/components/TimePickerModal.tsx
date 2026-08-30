import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const hourOptions = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, '0'));
const minuteOptions = Array.from({ length: 12 }, (_, index) => (index * 5).toString().padStart(2, '0'));

export function TimePickerModal({
  label,
  onClose,
  onSelect,
  value,
}: {
  label: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  value: string;
}) {
  const insets = useSafeAreaInsets();
  const [initialHour = '09', initialMinute = '00'] = value.split(':');
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  const selectedTime = `${selectedHour}:${selectedMinute}`;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Saat seçimini kapat"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.clockShell}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={21}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.headerText}>
              <AppText variant="heading">{label}</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Saat ve dakikayı seç
              </AppText>
            </View>
            <AppText color="primary" style={styles.preview} variant="heading">
              {selectedTime}
            </AppText>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <AppText style={styles.sectionTitle} variant="label">Saat</AppText>
            <View style={styles.options}>
              {hourOptions.map((hour) => {
                const selected = hour === selectedHour;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={hour}
                    onPress={() => setSelectedHour(hour)}
                    style={({ pressed }) => [
                      styles.hourOption,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <AppText color={selected ? 'onPrimary' : 'text'} variant="label">
                      {hour}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText style={styles.sectionTitle} variant="label">Dakika</AppText>
            <View style={styles.options}>
              {minuteOptions.map((minute) => {
                const selected = minute === selectedMinute;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={minute}
                    onPress={() => setSelectedMinute(minute)}
                    style={({ pressed }) => [
                      styles.minuteOption,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <AppText color={selected ? 'onPrimary' : 'text'} variant="label">
                      {minute}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.action, styles.cancelAction, pressed && styles.pressed]}>
              <AppText variant="label">Vazgeç</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(selectedTime)}
              style={({ pressed }) => [styles.action, styles.confirmAction, pressed && styles.pressed]}>
              <AppText color="onPrimary" variant="label">Saati Kullan</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(30, 24, 20, 0.42)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    width: 44,
  },
  header: { alignItems: 'center', flexDirection: 'row' },
  clockShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  headerText: { flex: 1, marginLeft: spacing.sm },
  preview: { fontSize: 24, lineHeight: 30 },
  content: { paddingBottom: spacing.sm },
  sectionTitle: { marginBottom: spacing.sm, marginTop: spacing.lg },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  hourOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    width: '14.8%',
  },
  minuteOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    width: '22.9%',
  },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  action: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelAction: { backgroundColor: colors.surfaceMuted },
  confirmAction: { backgroundColor: colors.primary },
  pressed: { opacity: 0.7 },
});
