import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

const hourOptions = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, '0'));
const minuteOptions = Array.from({ length: 12 }, (_, index) => (index * 5).toString().padStart(2, '0'));
const wheelItemHeight = 52;

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
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [initialHour = '09', initialMinute = '00'] = value.split(':');
  const normalizedMinute = nearestMinuteOption(initialMinute);
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(normalizedMinute);
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
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: themeColors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: themeColors.border }]} />
          <View style={styles.header}>
            <View style={[styles.clockShell, { backgroundColor: themeColors.surfaceMuted }]}>
              <SymbolView
                name={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
                size={21}
                tintColor={themeColors.primary}
              />
            </View>
            <View style={styles.headerText}>
              <AppText variant="heading">{label}</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Aşağı veya yukarı kaydır
              </AppText>
            </View>
            <AppText color="primary" style={styles.preview} variant="heading">
              {selectedTime}
            </AppText>
          </View>

          <View style={styles.wheels}>
            <View style={styles.wheelColumn}>
              <AppText color="textMuted" style={styles.wheelLabel} variant="label">
                Saat
              </AppText>
              <TimeWheel
                accessibilityLabel="Saat"
                onChange={setSelectedHour}
                options={hourOptions}
                value={selectedHour}
              />
            </View>
            <AppText color="primary" style={styles.separator} variant="heading">
              :
            </AppText>
            <View style={styles.wheelColumn}>
              <AppText color="textMuted" style={styles.wheelLabel} variant="label">
                Dakika
              </AppText>
              <TimeWheel
                accessibilityLabel="Dakika"
                onChange={setSelectedMinute}
                options={minuteOptions}
                value={selectedMinute}
              />
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: themeColors.surfaceMuted },
                pressed && styles.pressed,
              ]}>
              <AppText variant="label">Vazgeç</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(selectedTime)}
              style={({ pressed }) => [
                styles.action,
                { backgroundColor: themeColors.primary },
                pressed && styles.pressed,
              ]}>
              <AppText color="onPrimary" variant="label">Saati Kullan</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TimeWheel({
  accessibilityLabel,
  onChange,
  options,
  value,
}: {
  accessibilityLabel: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  const themeColors = useThemeColors();
  const listRef = useRef<FlatList<string>>(null);
  const selectedIndex = Math.max(options.indexOf(value), 0);

  function updateFromScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.max(
      0,
      Math.min(options.length - 1, Math.round(event.nativeEvent.contentOffset.y / wheelItemHeight)),
    );
    const nextValue = options[nextIndex];
    if (nextValue !== value) onChange(nextValue);
  }

  return (
    <View
      accessibilityLabel={`${accessibilityLabel}: ${value}`}
      accessibilityRole="adjustable"
      style={styles.wheelViewport}>
      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,
          {
            backgroundColor: themeColors.surfaceMuted,
            borderColor: themeColors.primary,
          },
        ]}
      />
      <FlatList
        contentContainerStyle={styles.wheelContent}
        data={options}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          index,
          length: wheelItemHeight,
          offset: wheelItemHeight * index,
        })}
        initialScrollIndex={selectedIndex}
        keyExtractor={(item) => item}
        onMomentumScrollEnd={updateFromScroll}
        onScroll={updateFromScroll}
        ref={listRef}
        renderItem={({ item, index }) => {
          const selected = item === value;
          return (
            <Pressable
              accessibilityLabel={`${accessibilityLabel} ${item}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                onChange(item);
                listRef.current?.scrollToIndex({ animated: true, index });
              }}
              style={styles.wheelItem}>
              <AppText
                color={selected ? 'primary' : 'textMuted'}
                style={[styles.wheelValue, selected && styles.selectedWheelValue]}
                variant={selected ? 'heading' : 'body'}>
                {item}
              </AppText>
            </Pressable>
          );
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={wheelItemHeight}
      />
    </View>
  );
}

function nearestMinuteOption(value: string) {
  const minute = Number(value);
  if (!Number.isFinite(minute)) return '00';
  const rounded = Math.round(minute / 5) * 5;
  return String(rounded >= 60 ? 55 : rounded).padStart(2, '0');
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(30, 24, 20, 0.42)', flex: 1, justifyContent: 'flex-end' },
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
    marginBottom: spacing.md,
    width: 44,
  },
  header: { alignItems: 'center', flexDirection: 'row' },
  clockShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  headerText: { flex: 1, marginLeft: spacing.sm },
  preview: { fontSize: 24, lineHeight: 30 },
  wheels: {
    alignItems: 'flex-end',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    width: '78%',
  },
  wheelColumn: { flex: 1 },
  wheelLabel: { marginBottom: spacing.xs, textAlign: 'center' },
  wheelViewport: {
    height: wheelItemHeight * 3,
    overflow: 'hidden',
    position: 'relative',
  },
  wheelContent: { paddingVertical: wheelItemHeight },
  wheelItem: {
    alignItems: 'center',
    height: wheelItemHeight,
    justifyContent: 'center',
  },
  wheelValue: { fontSize: 20, opacity: 0.58 },
  selectedWheelValue: { fontSize: 28, lineHeight: 34, opacity: 1 },
  selectionBand: {
    borderRadius: radius.md,
    borderWidth: 1,
    height: wheelItemHeight,
    left: 0,
    position: 'absolute',
    right: 0,
    top: wheelItemHeight,
  },
  separator: { marginBottom: wheelItemHeight + 9 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  action: {
    alignItems: 'center',
    borderRadius: radius.md,
    flex: 1,
    justifyContent: 'center',
    minHeight: 50,
  },
  pressed: { opacity: 0.7 },
});
