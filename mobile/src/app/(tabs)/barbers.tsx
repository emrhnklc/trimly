import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { BarbershopPreviewCard } from '@/features/barbershops/components/BarbershopPreviewCard';
import {
  BarbershopDiscoveryFilters,
  type DiscoveryFilter,
} from '@/features/barbershops/components/BarbershopDiscoveryFilters';
import { BarbershopSearch } from '@/features/barbershops/components/BarbershopSearch';
import { getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BarbershopDiscoveryScreen() {
  const router = useRouter();
  const [barbershops, setBarbershops] = useState<PublicBarbershop[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>('featured');
  const [showFilters, setShowFilters] = useState(true);
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
      setError(loadError instanceof Error ? loadError.message : 'İşletmeler yüklenemedi.');
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

  const displayedBarbershops = useMemo(() => {
    if (activeFilter === 'popular') {
      return [...barbershops].sort((first, second) => second.ratingCount - first.ratingCount);
    }

    if (activeFilter === 'new') {
      return [...barbershops].sort((first, second) => {
        const firstCreatedAt = first.createdAt ? Date.parse(first.createdAt) : 0;
        const secondCreatedAt = second.createdAt ? Date.parse(second.createdAt) : 0;
        return secondCreatedAt - firstCreatedAt;
      });
    }

    return barbershops;
  }, [activeFilter, barbershops]);

  const sectionTitle = submittedSearch
    ? `“${submittedSearch}” sonuçları`
    : activeFilter === 'nearby'
      ? 'Yakınındaki İşletmeler'
      : activeFilter === 'popular'
        ? 'Popüler İşletmeler'
        : activeFilter === 'new'
          ? 'Yeni İşletmeler'
          : 'Öne Çıkan İşletmeler';

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={displayedBarbershops}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyTitle} variant="heading">
                {error ? 'Bir sorun oluştu' : 'İşletme bulunamadı'}
              </AppText>
              <AppText color="textMuted" style={styles.emptyDescription}>
                {error ?? 'Arama kelimeni değiştirip tekrar deneyebilirsin.'}
              </AppText>
            </View>
          )
        }
        ListHeaderComponent={
          <View>
            <HomeHeader />
            <AppText style={styles.title} variant="displayLarge">Berberler</AppText>
            <AppText color="textMuted" style={styles.subtitle}>
              Tarzına en uygun berber dükkânını keşfet.
            </AppText>
            <BarbershopSearch
              onChangeText={setSearchText}
              onFilterPress={() => setShowFilters((current) => !current)}
              onSubmit={submitSearch}
              value={searchText}
            />
            {showFilters ? (
              <View style={styles.filters}>
                <BarbershopDiscoveryFilters activeFilter={activeFilter} onChange={setActiveFilter} />
              </View>
            ) : null}
            <View style={styles.resultsHeader}>
              <AppText variant="heading">{sectionTitle}</AppText>
              {!isLoading ? (
                <AppText color="primary" variant="bodySmall">{displayedBarbershops.length} sonuç</AppText>
              ) : null}
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => void loadBarbershops(submittedSearch, true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <BarbershopPreviewCard
            barbershop={item}
            onPress={() => router.push(`/barbers/${item.slug}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  title: { fontSize: 30, lineHeight: 36, marginTop: spacing.xl },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  filters: { marginHorizontal: -spacing.lg, marginTop: spacing.md, paddingLeft: spacing.lg },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  separator: { height: spacing.xs },
  loader: { marginTop: spacing.xxl },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  emptyTitle: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.xs, textAlign: 'center' },
});
