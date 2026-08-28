import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { AvailabilitySlot } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

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
              style={[styles.hour, isSelected && styles.selectedHour]}>
              <AppText color={isSelected ? 'onPrimary' : 'text'} variant="label">{hour}:00</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedHour ? (
        <View style={styles.slots}>
          {visibleSlots.map((slot) => {
            const isSelected = slot.startsAt === selectedStartsAt;
            return (
              <Pressable
                key={slot.startsAt}
                onPress={() => onSlotSelect(slot)}
                style={[styles.slot, isSelected && styles.selectedSlot]}>
                <AppText color={isSelected ? 'onPrimary' : 'text'} variant="label">{slot.startTime}</AppText>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hourContent: { gap: spacing.xs, paddingRight: spacing.lg },
  hour: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectedHour: { backgroundColor: colors.primary, borderColor: colors.primary },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  slot: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minWidth: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  selectedSlot: { backgroundColor: colors.primary, borderColor: colors.primary },
});
