import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BrandedPageHeader } from '@/components/ui/BrandedPageHeader';
import { Screen } from '@/components/ui/Screen';
import { BarbershopPreviewCard } from '@/features/barbershops/components/BarbershopPreviewCard';
import {
  BarbershopDiscoveryFilters,
  type DiscoveryFilter,
} from '@/features/barbershops/components/BarbershopDiscoveryFilters';
import { BarbershopSearch } from '@/features/barbershops/components/BarbershopSearch';
import { getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BarbershopDiscoveryScreen() {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [barbershops, setBarbershops] = useState<PublicBarbershop[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>('featured');
  const [showFilters, setShowFilters] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const loadBarbershops = useCallback(async (search?: string, refresh = false, location?: { latitude: number; longitude: number }) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setBarbershops(await getPublicBarbershops(search, location));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'İşletmeler yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  function submitSearch() {
    const search = searchText.trim();
    setSubmittedSearch(search);
    void loadBarbershops(search);
  }

  const changeFilter = useCallback(async (nextFilter: DiscoveryFilter) => {
    setActiveFilter(nextFilter);
    setLocationError(null);
    if (nextFilter !== 'nearby') {
      await loadBarbershops(submittedSearch);
      return;
    }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setLocationError('Yakındaki işletmeleri gösterebilmemiz için konum izni vermelisin.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await loadBarbershops(submittedSearch, false, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setLocationError('Konum alınamadı. Cihazının konum ayarlarını kontrol edip tekrar dene.');
    }
  }, [loadBarbershops, submittedSearch]);

  useEffect(() => {
    const requestId = setTimeout(
      () => void (filter === 'nearby' ? changeFilter('nearby') : loadBarbershops()),
      0,
    );
    return () => clearTimeout(requestId);
  }, [changeFilter, filter, loadBarbershops]);

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
            <BrandedPageHeader
              subtitle="Tarzına en uygun berber dükkânını keşfet."
              title="Berberler"
            />
            <BarbershopSearch
              onChangeText={setSearchText}
              onFilterPress={() => setShowFilters((current) => !current)}
              onSubmit={submitSearch}
              value={searchText}
            />
            {showFilters ? (
              <View style={styles.filters}>
                <BarbershopDiscoveryFilters activeFilter={activeFilter} onChange={(filter) => void changeFilter(filter)} />
              </View>
            ) : null}
            <View style={styles.resultsHeader}>
              <AppText variant="heading">{sectionTitle}</AppText>
              {!isLoading ? (
                <AppText color="primary" variant="bodySmall">{displayedBarbershops.length} sonuç</AppText>
              ) : null}
            </View>
            {locationError ? <AppText color="danger" style={styles.locationError} variant="bodySmall">{locationError}</AppText> : null}
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
  filters: { marginHorizontal: -spacing.lg, marginTop: spacing.md, paddingLeft: spacing.lg },
  resultsHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  separator: { height: spacing.sm },
  loader: { marginTop: spacing.xxl },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  emptyTitle: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.xs, textAlign: 'center' },
  locationError: { marginBottom: spacing.sm, textAlign: 'center' },
});
