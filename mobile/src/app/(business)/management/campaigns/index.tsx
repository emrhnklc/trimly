import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getManagementCampaigns, updateCampaign } from '@/features/campaigns/api';
import { CampaignCard } from '@/features/campaigns/components/CampaignCard';
import type { Campaign } from '@/features/campaigns/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function ManagementCampaignsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (!activeMembership || !token) return;
    if (refreshing) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      setCampaigns(await getManagementCampaigns(activeMembership.barbershop.id, token));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kampanyalar yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeMembership, token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function toggle(campaign: Campaign) {
    if (!activeMembership || !token) return;
    try {
      const updated = await updateCampaign(
        activeMembership.barbershop.id,
        campaign.id,
        { isActive: !campaign.isActive },
        token,
      );
      setCampaigns((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Kampanya güncellenemedi.');
    }
  }

  if (!activeMembership) return null;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={campaigns}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        keyExtractor={(campaign) => campaign.id}
        ListHeaderComponent={
          <>
            <BusinessDetailHeader
              actionIcon={{ ios: 'plus', android: 'add', web: 'add' }}
              actionLabel="Yeni kampanya ekle"
              onAction={() => router.push('/management/campaigns/new')}
              onBack={() => goBackOrReplace(router, '/(business)/management')}
              title="Kampanyalar"
            />
            <AppText color="textMuted" style={styles.intro}>
              Boş saatleri değerlendirmek için hizmetlerine süreli indirim tanımla.
            </AppText>
            {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
            {error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}
          </>
        }
        ListEmptyComponent={!isLoading ? (
          <View style={styles.empty}>
            <AppText style={styles.emptyTitle} variant="sectionTitle">Henüz kampanya yok</AppText>
            <AppText color="textMuted" style={styles.emptyCopy}>İlk kampanyanı oluşturup müşterilerin randevu sırasında kullanmasını sağlayabilirsin.</AppText>
            <AppButton onPress={() => router.push('/management/campaigns/new')}>Kampanya Oluştur</AppButton>
          </View>
        ) : null}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        renderItem={({ item }) => <CampaignCard campaign={item} management onPress={() => void toggle(item)} />}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  intro: { marginBottom: spacing.lg },
  loader: { marginVertical: spacing.xxl },
  error: { marginBottom: spacing.md },
  gap: { height: spacing.sm },
  empty: { gap: spacing.md, marginTop: spacing.xxl },
  emptyTitle: { fontSize: 22, lineHeight: 28 },
  emptyCopy: { marginBottom: spacing.xs },
});
