import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BrandedPageHeader } from '@/components/ui/BrandedPageHeader';
import { Screen } from '@/components/ui/Screen';
import { BarbershopPreviewCard } from '@/features/barbershops/components/BarbershopPreviewCard';
import {
  BarbershopFilterSheet,
  type DetailedDiscoveryFilters,
} from '@/features/barbershops/components/BarbershopFilterSheet';
import {
  BarbershopDiscoveryFilters,
  type DiscoveryFilter,
} from '@/features/barbershops/components/BarbershopDiscoveryFilters';
import { BarbershopSearch } from '@/features/barbershops/components/BarbershopSearch';
import { getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  addFavoriteBarbershop,
  getFavoriteBarbershops,
  removeFavoriteBarbershop,
} from '@/features/favorites/api';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BarbershopDiscoveryScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [barbershops, setBarbershops] = useState<PublicBarbershop[]>([]);
  const [searchText, setSearchText] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<DiscoveryFilter>('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [districtFilter, setDistrictFilter] = useState<string | null>(null);
  const [serviceFilter, setServiceFilter] = useState<string | null>(null);
  const [teamOnly, setTeamOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
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

  useEffect(() => {
    if (!token) return;
    let isActive = true;
    void getFavoriteBarbershops(token)
      .then((favorites) => {
        if (isActive) setFavoriteIds(favorites.map(({ barbershop }) => barbershop.id));
      })
      .catch(() => undefined);
    return () => {
      isActive = false;
    };
  }, [token]);

  const districtOptions = useMemo(
    () => [...new Set(
      barbershops
        .map(({ address }) => getDistrict(address))
        .filter((district): district is string => Boolean(district)),
    )].sort((first, second) => first.localeCompare(second, 'tr')),
    [barbershops],
  );
  const serviceOptions = useMemo(
    () => [...new Set(barbershops.flatMap(({ serviceNames }) => serviceNames ?? []))]
      .sort((first, second) => first.localeCompare(second, 'tr')),
    [barbershops],
  );

  const displayedBarbershops = useMemo(() => {
    const filtered = barbershops.filter((barbershop) => {
      if (districtFilter && getDistrict(barbershop.address) !== districtFilter) return false;
      if (serviceFilter && !barbershop.serviceNames?.includes(serviceFilter)) return false;
      if (teamOnly && (barbershop.members?.length ?? 0) < 2) return false;
      return true;
    });

    if (activeFilter === 'popular') {
      return [...filtered].sort((first, second) => second.ratingCount - first.ratingCount);
    }

    if (activeFilter === 'new') {
      return [...filtered].sort((first, second) => {
        const firstCreatedAt = first.createdAt ? Date.parse(first.createdAt) : 0;
        const secondCreatedAt = second.createdAt ? Date.parse(second.createdAt) : 0;
        return secondCreatedAt - firstCreatedAt;
      });
    }

    return filtered;
  }, [activeFilter, barbershops, districtFilter, serviceFilter, teamOnly]);

  async function toggleFavorite(barbershopId: string) {
    if (!token) return;
    const wasFavorite = favoriteIds.includes(barbershopId);
    setFavoriteIds((current) =>
      wasFavorite ? current.filter((id) => id !== barbershopId) : [...current, barbershopId],
    );
    try {
      if (wasFavorite) await removeFavoriteBarbershop(barbershopId, token);
      else await addFavoriteBarbershop(barbershopId, token);
    } catch {
      setFavoriteIds((current) =>
        wasFavorite ? [...new Set([...current, barbershopId])] : current.filter((id) => id !== barbershopId),
      );
    }
  }

  function applyDetailedFilters(filters: DetailedDiscoveryFilters) {
    setDistrictFilter(filters.district);
    setServiceFilter(filters.service);
    setTeamOnly(filters.teamOnly);
    setIsFilterOpen(false);
    void changeFilter(filters.sort);
  }

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
          isLoading ? null : (
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
              onFilterPress={() => setIsFilterOpen(true)}
              onSubmit={submitSearch}
              value={searchText}
            />
            <View style={styles.filters}>
              <BarbershopDiscoveryFilters activeFilter={activeFilter} onChange={(filter) => void changeFilter(filter)} />
            </View>
            <View style={styles.resultsHeader}>
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
            isFavorite={favoriteIds.includes(item.id)}
            onFavoritePress={() => void toggleFavorite(item.id)}
            onPress={() => router.push(`/barbers/${item.slug}`)}
          />
        )}
      />
      {isFilterOpen ? (
        <BarbershopFilterSheet
          districts={districtOptions}
          onApply={applyDetailedFilters}
          onClose={() => setIsFilterOpen(false)}
          services={serviceOptions}
          value={{ district: districtFilter, service: serviceFilter, sort: activeFilter, teamOnly }}
          visible
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  filters: { marginHorizontal: -spacing.lg, marginTop: spacing.md, paddingLeft: spacing.lg },
  resultsHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  separator: { height: spacing.sm },
  loader: { marginTop: spacing.xxl },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  emptyTitle: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.xs, textAlign: 'center' },
  locationError: { marginBottom: spacing.sm, textAlign: 'center' },
});

function getDistrict(address: string | null) {
  if (!address) return null;
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.at(-2) ?? null;
  if (parts.length === 2) return parts.at(-1) ?? null;
  return parts[0] ?? null;
}
