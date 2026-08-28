import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getPublicBarbershops } from '@/features/barbershops/api';
import { BarbershopPreviewCard } from '@/features/barbershops/components/BarbershopPreviewCard';
import { BarbershopSearch } from '@/features/barbershops/components/BarbershopSearch';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeHeroCard } from '@/features/home/components/HomeHeroCard';
import { HomeIntro } from '@/features/home/components/HomeIntro';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DiscoverBarbershopsScreen() {
  const router = useRouter();
  const [barbershops, setBarbershops] = useState<PublicBarbershop[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBarbershops = useCallback(async (search?: string, refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setBarbershops(await getPublicBarbershops(search));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const requestId = setTimeout(() => void loadBarbershops(), 0);
    return () => clearTimeout(requestId);
  }, [loadBarbershops]);

  function submitSearch() {
    const search = searchText.trim();
    setSubmittedSearch(search);
    void loadBarbershops(search);
  }

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={barbershops}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <AppText color="textMuted" style={styles.emptyText}>
              {error ?? 'Henüz gösterilecek bir işletme yok.'}
            </AppText>
          )
        }
        ListHeaderComponent={
          <View>
            <HomeHeader />
            <HomeIntro />
            <HomeHeroCard onExplorePress={() => router.push('/barbers')} />
            <BarbershopSearch onChangeText={setSearchText} onSubmit={submitSearch} value={searchText} />
            <SectionHeader
              actionLabel={submittedSearch ? undefined : 'Tümünü gör'}
              onActionPress={submittedSearch ? undefined : () => void loadBarbershops()}
              title={submittedSearch ? `“${submittedSearch}” için sonuçlar` : 'Öne çıkan berberler'}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => void loadBarbershops(submittedSearch, true)}
            refreshing={isRefreshing}
          />
        }
        renderItem={({ item }) => (
          <BarbershopPreviewCard barbershop={item} onPress={() => router.push(`/barbers/${item.slug}`)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  separator: { height: spacing.xs },
  loader: { marginTop: spacing.xxl },
  emptyText: { paddingTop: spacing.sm, textAlign: 'center' },
});
