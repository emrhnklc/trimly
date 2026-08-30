import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatCompactRevenue } from '../format';
import type { RevenuePoint, RevenuePeriod } from '../types';

export function RevenueBarChart({
  period,
  points,
}: {
  period: RevenuePeriod;
  points: RevenuePoint[];
}) {
  const maximum = Math.max(...points.map((point) => Number(point.revenue)), 0);
  const barWidth = period === 'YEAR' ? 34 : period === 'WEEK' ? 38 : 48;

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <View>
          <AppText variant="label">Dönem gelir grafiği</AppText>
          <AppText color="textMuted" style={styles.description} variant="bodySmall">
            Sadece tamamlanan randevular
          </AppText>
        </View>
        <View style={styles.legend}>
          <View style={styles.legendDot} />
          <AppText color="textMuted" variant="bodySmall">Gelir</AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.chart,
          points.length <= 7 && styles.spreadChart,
        ]}
        horizontal
        showsHorizontalScrollIndicator={false}>
        {points.map((point) => {
          const revenue = Number(point.revenue);
          const height = maximum === 0 ? 5 : Math.max(5, (revenue / maximum) * 112);

          return (
            <View key={point.key} style={[styles.column, { width: barWidth }]}>
              <AppText color="textMuted" numberOfLines={1} style={styles.amount} variant="bodySmall">
                {revenue > 0 ? formatCompactRevenue(point.revenue) : ''}
              </AppText>
              <View style={styles.track}>
                <View style={[styles.bar, { height }]} />
              </View>
              <AppText style={styles.label} variant="bodySmall">{point.label}</AppText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  heading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  description: { marginTop: 2 },
  legend: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs },
  legendDot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 8, width: 8 },
  chart: { alignItems: 'flex-end', gap: spacing.sm, minWidth: '100%', paddingTop: spacing.lg },
  spreadChart: { justifyContent: 'space-between' },
  column: { alignItems: 'center' },
  amount: { fontSize: 10, lineHeight: 14, maxWidth: 54, textAlign: 'center' },
  track: { height: 120, justifyContent: 'flex-end', marginTop: spacing.xxs },
  bar: { backgroundColor: colors.primary, borderRadius: radius.sm, minHeight: 5, width: 24 },
  label: { marginTop: spacing.xs, textAlign: 'center', textTransform: 'capitalize' },
});
