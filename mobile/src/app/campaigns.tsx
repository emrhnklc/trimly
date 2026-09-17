import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getActiveCampaigns } from '@/features/campaigns/api';
import { CampaignCard } from '@/features/campaigns/components/CampaignCard';
import type { Campaign } from '@/features/campaigns/types';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function CustomerCampaignsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (!token) return;
    if (refreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setCampaigns(await getActiveCampaigns(token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kampanyalar yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={campaigns}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        keyExtractor={(campaign) => campaign.id}
        ListHeaderComponent={
          <>
            <BusinessDetailHeader onBack={() => router.back()} title="Kampanyalar" />
            <AppText color="textMuted" style={styles.intro}>Sana uygun hizmetlerdeki güncel fırsatları keşfet.</AppText>
            {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {error ? <View style={styles.error}><AppText color="danger">{error}</AppText><AppButton onPress={() => void load()} variant="secondary">Tekrar Dene</AppButton></View> : null}
          </>
        }
        ListEmptyComponent={!isLoading && !error ? <View style={styles.empty}><AppText style={styles.emptyTitle} variant="sectionTitle">Şu an aktif kampanya yok</AppText><AppText color="textMuted">Yeni fırsatlar yayınlandığında burada görebileceksin.</AppText></View> : null}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <CampaignCard
            campaign={item}
            onPress={item.campaignType === 'LOYALTY' && !item.customerProgress?.isEligible
              ? undefined
              : () => router.push({ pathname: '/book', params: { campaignId: item.id, serviceId: item.services[0]?.service.id, slug: item.barbershop.slug } })}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  intro: { marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xxl },
  gap: { height: spacing.sm },
  error: { gap: spacing.md, marginVertical: spacing.xl },
  empty: { gap: spacing.xs, marginTop: spacing.xxl },
  emptyTitle: { fontSize: 22, lineHeight: 28 },
});
