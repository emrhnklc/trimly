import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { AvailabilitySlot } from '@/features/barbershops/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BookingTimePickerProps = {
  onHourSelect: (hour: string) => void;
  onSlotSelect: (slot: AvailabilitySlot) => void;
  selectedHour: string | null;
  selectedStartsAt: string | null;
  slots: AvailabilitySlot[];
};

export function BookingTimePicker({
  onHourSelect,
  onSlotSelect,
  selectedHour,
  selectedStartsAt,
  slots,
}: BookingTimePickerProps) {
  const colors = useThemeColors();
  const hours = [...new Set(slots.map((slot) => slot.startTime.slice(0, 2)))];
  const visibleSlots = selectedHour
    ? slots.filter((slot) => slot.startTime.startsWith(`${selectedHour}:`))
    : [];

  if (!slots.length) {
    return <AppText color="textMuted">Bu tarih için uygun saat bulunamadı.</AppText>;
  }

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.hourContent}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {hours.map((hour) => {
          const isSelected = hour === selectedHour;
          return (
            <Pressable
              key={hour}
              onPress={() => onHourSelect(hour)}
              style={[
                styles.hour,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}>
              <AppText color={isSelected ? 'onPrimary' : 'text'} variant="label">{hour}:00</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedHour ? (
        <View style={[styles.slotPanel, { backgroundColor: colors.surfaceMuted }]}>
          <AppText color="textMuted" variant="bodySmall">
            {selectedHour}:00 saat aralığındaki uygun başlangıçlar
          </AppText>
          <View style={styles.slots}>
            {visibleSlots.map((slot) => {
              const isSelected = slot.startsAt === selectedStartsAt;
              return (
                <Pressable
                  key={slot.startsAt}
                  onPress={() => onSlotSelect(slot)}
                  style={[
                    styles.slot,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}>
                  <AppText color={isSelected ? 'onPrimary' : 'text'} variant="label">{slot.startTime}</AppText>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hourContent: { gap: spacing.xs, paddingRight: spacing.lg },
  hour: {
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  slotPanel: {
    borderRadius: radius.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  slot: {
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
});
