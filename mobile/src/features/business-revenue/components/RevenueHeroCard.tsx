import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatTurkishPrice } from '@/features/business-management/format';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import type { RevenueSummary } from '../types';

export function RevenueHeroCard({ summary }: { summary: RevenueSummary }) {
  const hasPreviousRevenue = Number(summary.previousRevenue) > 0;
  const changeIsPositive = (summary.changePercentage ?? 0) >= 0;
  const comparisonLabel = hasPreviousRevenue
    ? `${changeIsPositive ? '↑' : '↓'} %${Math.abs(summary.changePercentage ?? 0).toLocaleString('tr-TR')}`
    : Number(summary.totalRevenue) > 0
      ? 'İlk gelir dönemi'
      : 'Henüz gelir yok';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <AppText style={styles.overline} variant="overline">TAMAMLANAN İŞLEMLERDEN</AppText>
          <AppText color="onPrimary" style={styles.revenue} variant="displayMedium">
            {formatTurkishPrice(summary.totalRevenue)}
          </AppText>
          <AppText style={styles.revenueLabel} variant="bodySmall">Toplam gelir</AppText>
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
      <View style={styles.comparisonRow}>
        <View style={[styles.badge, !changeIsPositive && hasPreviousRevenue && styles.negativeBadge]}>
          <AppText
            style={[styles.badgeLabel, !changeIsPositive && hasPreviousRevenue && styles.negativeLabel]}
            variant="label">
            {comparisonLabel}
          </AppText>
        </View>
        <View style={styles.previousCopy}>
          <AppText style={styles.previousLabel} variant="bodySmall">Önceki dönem</AppText>
          <AppText color="onPrimary" variant="label">
            {formatTurkishPrice(summary.previousRevenue)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    marginTop: spacing.sm,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  overline: { color: '#DFC78E' },
  revenue: { fontSize: 32, lineHeight: 39, marginTop: spacing.xxs },
  revenueLabel: { color: '#DDD3C9', marginTop: 2 },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#F4E7C8',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  divider: { backgroundColor: '#594C43', height: 1, marginVertical: spacing.md },
  comparisonRow: { alignItems: 'center', flexDirection: 'row' },
  badge: {
    backgroundColor: '#DDECD8',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  negativeBadge: { backgroundColor: '#F5D8D4' },
  badgeLabel: { color: '#4F7653' },
  negativeLabel: { color: colors.danger },
  previousCopy: { alignItems: 'flex-end', flex: 1 },
  previousLabel: { color: '#CFC5BC' },
});
