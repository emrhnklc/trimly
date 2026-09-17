import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import type { WorkingDayDraft } from '../types';

export function WorkingHoursDayCard({
  closedLabel = 'Randevuya kapalı',
  day,
  disabled = false,
  label,
  onChangeTime,
  onToggle,
}: {
  closedLabel?: string;
  day: WorkingDayDraft;
  disabled?: boolean;
  label: string;
  onChangeTime: (field: 'startTime' | 'endTime') => void;
  onToggle: (isOpen: boolean) => void;
}) {
  const colors = useThemeColors();
  return (
    <View style={[
      styles.card,
      {
        backgroundColor: colors.surface,
        borderColor: day.isOpen ? colors.primary : colors.border,
      },
      disabled && styles.disabled,
    ]}>
      <View style={styles.topRow}>
        <View style={styles.dayCopy}>
          <AppText style={styles.dayLabel} variant="label">{label}</AppText>
          <AppText color={day.isOpen ? 'primary' : 'textMuted'} variant="bodySmall">
            {day.isOpen ? `${day.startTime} – ${day.endTime}` : closedLabel}
          </AppText>
        </View>
        <Switch
          accessibilityLabel={`${label} gününü ${day.isOpen ? 'kapat' : 'aç'}`}
          disabled={disabled}
          ios_backgroundColor={colors.border}
          onValueChange={onToggle}
          thumbColor={colors.surface}
          trackColor={{ false: colors.border, true: '#DDBE70' }}
          value={day.isOpen}
        />
      </View>

      {day.isOpen ? (
        <View style={styles.timeRow}>
          <TimeButton
            colors={colors}
            disabled={disabled}
            label="Açılış"
            onPress={() => onChangeTime('startTime')}
            value={day.startTime}
          />
          <SymbolView
            name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
            size={17}
            tintColor={colors.textMuted}
          />
          <TimeButton
            colors={colors}
            disabled={disabled}
            label="Kapanış"
            onPress={() => onChangeTime('endTime')}
            value={day.endTime}
          />
        </View>
      ) : null}
    </View>
  );
}

function TimeButton({
  colors,
  disabled,
  label,
  onPress,
  value,
}: {
  colors: ReturnType<typeof useThemeColors>;
  disabled: boolean;
  label: string;
  onPress: () => void;
  value: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`${label} saati ${value}`}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.timeButton,
        { backgroundColor: colors.background },
        pressed && styles.pressed,
      ]}>
      <AppText color="textMuted" variant="bodySmall">{label}</AppText>
      <AppText style={styles.timeValue} variant="label">{value}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  disabled: { opacity: 0.58 },
  topRow: { alignItems: 'center', flexDirection: 'row' },
  dayCopy: { flex: 1, minWidth: 0 },
  dayLabel: { fontSize: 15, lineHeight: 20, marginBottom: 2 },
  timeRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  timeButton: {
    borderRadius: radius.md,
    flex: 1,
    minWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  timeValue: { fontSize: 16, lineHeight: 22, marginTop: 2 },
  pressed: { opacity: 0.66 },
});
