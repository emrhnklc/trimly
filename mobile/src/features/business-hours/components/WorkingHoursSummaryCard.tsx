import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatWeeklyDuration } from '../constants';

export function WorkingHoursSummaryCard({
  openDayCount,
  totalMinutes,
}: {
  openDayCount: number;
  totalMinutes: number;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView
          name={{ ios: 'calendar.badge.clock', android: 'date_range', web: 'date_range' }}
          size={23}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText color="onPrimary" variant="label">Haftalık çalışma düzeni</AppText>
        <AppText style={styles.description} variant="bodySmall">
          {openDayCount} gün açık · {formatWeeklyDuration(totalMinutes)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#F7E9C5',
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  copy: { flex: 1, marginLeft: spacing.sm },
  description: { color: '#DED2C7', marginTop: 2 },
});
