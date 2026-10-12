import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { DailyBusinessSummary } from '@/features/business-management/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { formatTurkishPrice } from '../format';

export function ManagementDailySummaryCard({ summary }: { summary: DailyBusinessSummary }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <SymbolView
              name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
              size={13}
              tintColor="#D8B960"
            />
            <AppText color="onPrimary" style={styles.overline} variant="overline">
              BUGÜNÜN ÖZETİ
            </AppText>
          </View>
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
        <SummaryStat
          icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          label={'Toplam\nrandevu'}
          value={summary.total}
        />
        <SummaryStat
          divided
          icon={{ ios: 'person', android: 'person', web: 'person' }}
          label={'Aktif\nrandevu'}
          value={summary.confirmed + summary.arrived}
        />
        <SummaryStat
          divided
          icon={{ ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' }}
          label="Tamamlanan"
          value={summary.completed}
        />
        <SummaryStat
          divided
          icon={{ ios: 'xmark.circle', android: 'cancel', web: 'cancel' }}
          label={'İptal\nedilen'}
          value={summary.cancelled}
        />
      </View>
    </View>
  );
}

function SummaryStat({
  divided = false,
  icon,
  label,
  value,
}: {
  divided?: boolean;
  icon: SymbolViewProps['name'];
  label: string;
  value: number;
}) {
  return (
    <View style={[styles.stat, divided && styles.statDivided]}>
      <SymbolView name={icon} size={20} tintColor="#D8B960" />
      <AppText color="onPrimary" style={styles.statValue} variant="label">{value}</AppText>
      <AppText
        adjustsFontSizeToFit
        color="onPrimary"
        minimumFontScale={0.6}
        numberOfLines={label.includes('\n') ? 2 : 1}
        style={styles.statLabel}
        variant="bodySmall">
        {label}
      </AppText>
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
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs },
  overline: { color: '#DFC78E', fontSize: 12, lineHeight: 16 },
  revenue: { fontFamily: fontFamily.bodyBold, fontSize: 31, lineHeight: 38, marginTop: spacing.xs },
  revenueLabel: { color: '#DDD3C9', fontSize: 12, lineHeight: 17, marginTop: 1 },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#F4E7C8',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  divider: { backgroundColor: '#66584E', height: 1, marginVertical: spacing.md },
  stats: { flexDirection: 'row' },
  stat: { alignItems: 'center', flex: 1, minHeight: 86, paddingHorizontal: 1 },
  statDivided: { borderLeftColor: '#66584E', borderLeftWidth: 1 },
  statValue: { fontFamily: fontFamily.bodySemiBold, fontSize: 17, lineHeight: 22, marginTop: spacing.xxs },
  statLabel: { color: '#DED6CE', fontSize: 12, lineHeight: 16, marginTop: 1, textAlign: 'center' },
});
