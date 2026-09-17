import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatTurkishPrice } from '@/features/business-management/format';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import type { RevenueSummary } from '../types';

export function RevenueMetrics({ summary }: { summary: RevenueSummary }) {
  return (
    <View style={styles.grid}>
      <Metric
        icon={{ ios: 'checkmark.circle', android: 'check_circle_outline', web: 'check_circle_outline' }}
        label="Tamamlanan"
        value={`${summary.completed} randevu`}
      />
      <Metric
        icon={{ ios: 'banknote', android: 'payments', web: 'payments' }}
        label="Ortalama sepet"
        value={formatTurkishPrice(summary.averageTicket)}
      />
      <Metric
        icon={{ ios: 'calendar.badge.exclamationmark', android: 'event_busy', web: 'event_busy' }}
        label="İptal"
        value={`${summary.cancelled} randevu`}
      />
      <Metric
        icon={{ ios: 'person.crop.circle.badge.xmark', android: 'person_off', web: 'person_off' }}
        label="Gelinmedi"
        value={`${summary.noShow} randevu`}
      />
    </View>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  const colors = useThemeColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.iconShell, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={icon} size={18} tintColor={colors.primary} />
      </View>
      <AppText color="textMuted" style={styles.label} variant="bodySmall">{label}</AppText>
      <AppText style={styles.value} variant="label">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 112,
    padding: spacing.sm,
    width: '48.2%',
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  label: { marginTop: spacing.xs },
  value: { marginTop: 2 },
});
