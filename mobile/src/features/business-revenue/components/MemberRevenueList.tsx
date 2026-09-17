import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatTurkishPrice } from '@/features/business-management/format';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import type { MemberRevenueSummary } from '../types';

export function MemberRevenueList({
  members,
  totalRevenue,
}: {
  members: MemberRevenueSummary[];
  totalRevenue: string;
}) {
  const colors = useThemeColors();
  const total = Number(totalRevenue);

  if (members.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <AppText variant="label">Bu dönemde tamamlanan işlem yok</AppText>
        <AppText color="textMuted" style={styles.emptyDescription} variant="bodySmall">
          Randevular tamamlandıkça çalışan gelir dağılımı burada görünecek.
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {members.map((member, index) => {
        const percentage = total > 0 ? (Number(member.completedRevenue) / total) * 100 : 0;
        const progressWidth = Math.min(100, Math.max(3, percentage));
        const initials = member.name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0])
          .join('');

        return (
          <View
            key={member.memberId}
            style={[
              styles.row,
              index < members.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
            ]}>
            <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
              <AppText color="primary" variant="label">{initials}</AppText>
            </View>
            <View style={styles.copy}>
              <View style={styles.nameRow}>
                <AppText numberOfLines={1} style={styles.name} variant="label">{member.name}</AppText>
                <AppText color="primary" variant="label">
                  {formatTurkishPrice(member.completedRevenue)}
                </AppText>
              </View>
              <AppText color="textMuted" style={styles.meta} variant="bodySmall">
                {member.completed} tamamlanan işlem · %{Math.round(percentage)} pay
              </AppText>
              <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progress,
                    { backgroundColor: colors.primary },
                    { width: `${progressWidth}%` as `${number}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 96, padding: spacing.sm },
  avatar: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  copy: { flex: 1, marginLeft: spacing.sm },
  nameRow: { alignItems: 'center', flexDirection: 'row' },
  name: { flex: 1, paddingRight: spacing.sm },
  meta: { marginTop: 2 },
  progressTrack: {
    borderRadius: radius.pill,
    height: 5,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progress: { borderRadius: radius.pill, height: '100%' },
  emptyCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  emptyDescription: { marginTop: spacing.xs, maxWidth: 290, textAlign: 'center' },
});
