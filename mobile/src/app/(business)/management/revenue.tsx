import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getDateKey } from '@/features/business-appointments/date';
import { getRevenueSummary } from '@/features/business-revenue/api';
import { MemberRevenueList } from '@/features/business-revenue/components/MemberRevenueList';
import { RevenueBarChart } from '@/features/business-revenue/components/RevenueBarChart';
import { RevenueHeroCard } from '@/features/business-revenue/components/RevenueHeroCard';
import { RevenueMetrics } from '@/features/business-revenue/components/RevenueMetrics';
import { RevenuePeriodSelector } from '@/features/business-revenue/components/RevenuePeriodSelector';
import { RevenueRangeNavigator } from '@/features/business-revenue/components/RevenueRangeNavigator';
import { formatRevenueRange, shiftRevenueAnchor } from '@/features/business-revenue/date';
import type { RevenuePeriod, RevenueSummary } from '@/features/business-revenue/types';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';

export default function BusinessRevenueScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const timeZone = activeMembership?.barbershop.timezone ?? 'Europe/Istanbul';
  const todayKey = getDateKey(new Date(), timeZone);
  const [period, setPeriod] = useState<RevenuePeriod>('WEEK');
  const [anchor, setAnchor] = useState(todayKey);
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRevenue = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setSummary(
          await getRevenueSummary(
            activeMembership.barbershop.id,
            period,
            anchor,
            token,
          ),
        );
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Gelir bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, anchor, period, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadRevenue();
    }, [loadRevenue]),
  );

  if (!activeMembership) return null;

  const nextAnchor = shiftRevenueAnchor(anchor, period, 1);
  const canGoNext = nextAnchor <= todayKey;

  function selectPeriod(nextPeriod: RevenuePeriod) {
    setPeriod(nextPeriod);
    setAnchor(todayKey);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadRevenue(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          onBack={() => router.dismissTo('/management')}
          title="Gelirler"
        />
        <RevenuePeriodSelector onChange={selectPeriod} value={period} />

        {summary ? (
          <RevenueRangeNavigator
            canGoNext={canGoNext}
            label={formatRevenueRange(summary.rangeStart, summary.rangeEnd, period)}
            onNext={() => canGoNext && setAnchor(nextAnchor)}
            onPrevious={() => setAnchor(shiftRevenueAnchor(anchor, period, -1))}
          />
        ) : null}

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error ? (
          <BusinessManagementState
            description={error}
            onRetry={() => void loadRevenue()}
            title="Gelir bilgileri yüklenemedi"
          />
        ) : null}

        {!isLoading && !error && summary ? (
          <>
            <RevenueHeroCard summary={summary} />
            <RevenueMetrics summary={summary} />

            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle} variant="sectionTitle">Gelir hareketi</AppText>
            </View>
            <RevenueBarChart period={period} points={summary.points} />

            <View style={styles.sectionHeading}>
              <AppText style={styles.sectionTitle} variant="sectionTitle">Çalışan katkısı</AppText>
            </View>
            <MemberRevenueList
              members={summary.byMember}
              totalRevenue={summary.totalRevenue}
            />

            <View style={styles.infoCard}>
              <AppText variant="label">Gelir nasıl hesaplanıyor?</AppText>
              <AppText color="textMuted" style={styles.infoDescription} variant="bodySmall">
                Randevu tamamlandığında kayıtlı hizmet fiyatı gelire eklenir. Ödeme ve tahsilat takibi henüz bu hesaba dahil değildir.
              </AppText>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
  sectionHeading: { marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  infoCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.card,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  infoDescription: { marginTop: 2 },
});
