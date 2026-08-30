import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { DailyBusinessSummary } from '@/features/business-management/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatTurkishPrice } from '../format';

export function ManagementDailySummaryCard({ summary }: { summary: DailyBusinessSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText color="onPrimary" style={styles.overline} variant="overline">
            BUGÜNÜN ÖZETİ
          </AppText>
          <AppText color="onPrimary" style={styles.revenue} variant="displayMedium">
            {formatTurkishPrice(summary.completedRevenue)}
          </AppText>
          <AppText color="onPrimary" style={styles.revenueLabel} variant="bodySmall">
            Tamamlanan işlemlerden gelir
          </AppText>
        </View>
        <View style={styles.iconShell}>
          <SymbolView
            name={{ ios: 'chart.line.uptrend.xyaxis', android: 'trending_up', web: 'trending_up' }}
            size={25}
            tintColor={colors.primary}
          />
        </View>
      </View>

      <View style={styles.divider} />
      <View style={styles.stats}>
        <SummaryStat label="Toplam" value={summary.total} />
        <SummaryStat label="Onaylı" value={summary.confirmed} />
        <SummaryStat label="Tamamlandı" value={summary.completed} />
        <SummaryStat label="İptal" value={summary.cancelled} />
      </View>
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText color="onPrimary" style={styles.statValue} variant="label">{value}</AppText>
      <AppText color="onPrimary" style={styles.statLabel} variant="bodySmall">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    marginTop: spacing.md,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  overline: { color: '#DFC78E', fontSize: 9, lineHeight: 13 },
  revenue: { fontSize: 30, lineHeight: 37, marginTop: spacing.xxs },
  revenueLabel: { color: '#DDD3C9', fontSize: 10, lineHeight: 14, marginTop: 2 },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#F4E7C8',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  divider: { backgroundColor: '#594C43', height: 1, marginVertical: spacing.md },
  stats: { flexDirection: 'row' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 14, lineHeight: 19 },
  statLabel: { color: '#CFC5BC', fontSize: 8, lineHeight: 12, marginTop: 2 },
});
