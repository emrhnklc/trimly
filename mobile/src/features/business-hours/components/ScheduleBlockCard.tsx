import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { MemberScheduleBlock } from '@/features/schedules/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatScheduleBlockDateRange } from '../date';

export function ScheduleBlockCard({
  block,
  onDelete,
  timeZone,
}: {
  block: MemberScheduleBlock;
  onDelete: () => void;
  timeZone: string;
}) {
  const isBreak = block.type === 'BREAK';

  return (
    <View style={styles.card}>
      <View style={[styles.iconShell, !isBreak && styles.timeOffIcon]}>
        <SymbolView
          name={isBreak
            ? { ios: 'cup.and.saucer', android: 'free_breakfast', web: 'free_breakfast' }
            : { ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' }}
          size={21}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">{isBreak ? 'Mola' : 'İzin'}</AppText>
        <AppText color="textMuted" style={styles.range} variant="bodySmall">
          {formatScheduleBlockDateRange(block.startsAt, block.endsAt, timeZone)}
        </AppText>
        {block.note ? (
          <AppText color="textMuted" numberOfLines={2} style={styles.note} variant="bodySmall">
            {block.note}
          </AppText>
        ) : null}
      </View>
      <Pressable
        accessibilityLabel={`${isBreak ? 'Molayı' : 'İzni'} kaldır`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onDelete}
        style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }}
          size={19}
          tintColor={colors.danger}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#F7E9C5',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  timeOffIcon: { backgroundColor: colors.surfaceMuted },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  range: { marginTop: 2 },
  note: { marginTop: spacing.xs },
  deleteButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: { opacity: 0.62 },
});
