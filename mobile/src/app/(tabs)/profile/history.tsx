import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getMyHaircutHistory } from '@/features/haircut-history/api';
import type { CustomerHaircutRecord } from '@/features/haircut-history/types';
import { ProfileSavedStyles } from '@/features/profile/components/ProfileSavedStyles';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileHistoryScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [records, setRecords] = useState<CustomerHaircutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (refreshing = false) => {
    if (!token) return;

    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setRecords(await getMyHaircutHistory(token));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Tıraş geçmişi yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  if (!token) return null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadHistory(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AppIconButton
            accessibilityLabel="Profile geri dön"
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            onPress={() => router.back()}
            variant="transparent"
          />
          <AppText style={styles.title} variant="displayMedium">Tıraş Geçmişim</AppText>
          <View style={styles.topBarSpacer} />
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? (
          <AppText color="danger" style={styles.error} variant="bodySmall">{error}</AppText>
        ) : null}
        {!isLoading && !error ? (
          <>
            <ProfileSavedStyles accessToken={token} records={records} />
            <View style={styles.historySection}>
              <AppText variant="heading">Tüm Tıraşlarım</AppText>
              {records.length ? (
                records.map((record) => <HaircutHistoryCard key={record.id} record={record} />)
              ) : (
                <AppText color="textMuted" style={styles.emptyText}>
                  Tamamlanan ve not eklenen tıraşların burada listelenecek.
                </AppText>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function HaircutHistoryCard({ record }: { record: CustomerHaircutRecord }) {
  const barberName = `${record.appointment.businessMember.user.firstName} ${record.appointment.businessMember.user.lastName}`;
  const date = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(record.appointment.startsAt));

  return (
    <AppCard style={styles.historyCard}>
      <View style={styles.cardTitleRow}>
        <AppText numberOfLines={1} style={styles.cardTitle} variant="label">
          {record.styleName ?? record.appointment.serviceNameSnapshot}
        </AppText>
        <AppText color="primary" variant="bodySmall">{date}</AppText>
      </View>
      <AppText color="textMuted" numberOfLines={1} style={styles.cardMeta} variant="bodySmall">
        {record.appointment.barbershop.name} · {barberName}
      </AppText>
      {record.notes ? (
        <AppText color="textMuted" style={styles.cardNotes} variant="bodySmall">{record.notes}</AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  topBarSpacer: { width: 44 },
  title: { flex: 1, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  error: { marginTop: spacing.xl, textAlign: 'center' },
  historySection: { marginTop: spacing.xl },
  historyCard: { marginTop: spacing.sm },
  cardTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  cardTitle: { flex: 1 },
  cardMeta: { marginTop: spacing.xs },
  cardNotes: { lineHeight: 18, marginTop: spacing.sm },
  emptyText: { lineHeight: 21, marginTop: spacing.sm },
});
