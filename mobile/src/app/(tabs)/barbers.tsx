import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { AppState, FlatList, Linking, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
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
  const [locationAction, setLocationAction] = useState<'permission' | 'settings' | 'retry'>('retry');
  const nearbyLocation = useRef<{ latitude: number; longitude: number } | undefined>(undefined);
  const locationRequest = useRef(0);
  const waitingForSettings = useRef(false);
  const initializedFilter = useRef<string | null>(null);

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
    if (activeFilter === 'nearby' && !nearbyLocation.current) {
      void changeFilter('nearby', search);
    } else {
      void loadBarbershops(search, false, activeFilter === 'nearby' ? nearbyLocation.current : undefined);
    }
  }

  const changeFilter = useCallback(async (nextFilter: DiscoveryFilter, search = submittedSearch) => {
    const request = ++locationRequest.current;
    setActiveFilter(nextFilter);
    setLocationError(null);
    nearbyLocation.current = undefined;
    if (nextFilter !== 'nearby') {
      await loadBarbershops(search);
      return;
    }
    setIsLoading(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (request !== locationRequest.current) return;
      if (!permission.granted) {
        setLocationAction(permission.canAskAgain ? 'permission' : 'settings');
        setLocationError(permission.canAskAgain
          ? 'Sana yakın işletmeleri sıralamak için konum iznine ihtiyacımız var. İzin vermeden diğer filtrelerle keşfetmeye devam edebilirsin.'
          : 'Konum izni kapalı. Ayarlar’dan Trimly için konum erişimini açarak sana yakın işletmeleri görebilirsin.');
        setBarbershops([]);
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (request !== locationRequest.current) return;
      if (!servicesEnabled) {
        setLocationAction('settings');
        setLocationError('Cihazının konum hizmetleri kapalı. Telefon ayarlarından konum hizmetlerini açıp tekrar dene.');
        setBarbershops([]);
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (request !== locationRequest.current) return;
      nearbyLocation.current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      await loadBarbershops(search, false, nearbyLocation.current);
    } catch {
      if (request !== locationRequest.current) return;
      setLocationAction('retry');
      setBarbershops([]);
      setLocationError('Konum alınamadı. Cihazının konum ayarlarını kontrol edip tekrar dene.');
    } finally {
      if (request === locationRequest.current) setIsLoading(false);
    }
  }, [loadBarbershops, submittedSearch]);

  useEffect(() => {
    const routeFilter = filter ?? 'featured';
    if (initializedFilter.current === routeFilter) return;
    const requestId = setTimeout(
      () => {
        initializedFilter.current = routeFilter;
        void (filter === 'nearby' ? changeFilter('nearby') : loadBarbershops());
      },
      0,
    );
    return () => clearTimeout(requestId);
  }, [changeFilter, filter, loadBarbershops]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active' && waitingForSettings.current) {
        waitingForSettings.current = false;
        if (activeFilter === 'nearby') void changeFilter('nearby');
      }
    });
    return () => subscription.remove();
  }, [activeFilter, changeFilter]);

  async function resolveLocation() {
    if (locationAction !== 'settings') {
      await changeFilter('nearby');
      return;
    }
    try {
      waitingForSettings.current = true;
      await Linking.openSettings();
    } catch {
      waitingForSettings.current = false;
      setLocationError('Ayarlar açılamadı. Telefonunun Ayarlar bölümünden Trimly konum iznini açabilirsin.');
    }
  }

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
          isLoading || locationError ? null : (
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
            {locationError ? (
              <AppCard style={styles.locationCard}>
                <AppText variant="heading">Yakınındaki işletmeleri keşfet</AppText>
                <AppText color="textMuted" variant="bodySmall">{locationError}</AppText>
                <AppButton disabled={isLoading} onPress={() => void resolveLocation()}>
                  {locationAction === 'settings' ? 'Ayarları Aç' : locationAction === 'permission' ? 'Konuma İzin Ver' : 'Tekrar Dene'}
                </AppButton>
                <AppButton variant="ghost" onPress={() => void changeFilter('featured')}>Konumsuz Devam Et</AppButton>
              </AppCard>
            ) : null}
          </View>
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => void (activeFilter === 'nearby' ? changeFilter('nearby') : loadBarbershops(submittedSearch, true))}
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
  locationCard: { gap: spacing.sm, marginBottom: spacing.md },
});

function getDistrict(address: string | null) {
  if (!address) return null;
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.at(-2) ?? null;
  if (parts.length === 2) return parts.at(-1) ?? null;
  return parts[0] ?? null;
}
