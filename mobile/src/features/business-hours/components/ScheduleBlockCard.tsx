import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { MemberScheduleBlock } from '@/features/schedules/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
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
  const colors = useThemeColors();
  const isBreak = block.type === 'BREAK';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[
        styles.iconShell,
        { backgroundColor: isBreak ? colors.background : colors.surfaceMuted },
      ]}>
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
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm, minWidth: 0 },
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
