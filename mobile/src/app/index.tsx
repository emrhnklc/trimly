import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { BarbershopSearch } from '@/features/home/components/BarbershopSearch';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeHeroCard } from '@/features/home/components/HomeHeroCard';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function DiscoverBarbershopsScreen() {
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
        data={barbershops}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void loadBarbershops(submittedSearch, true)}
          />
        }
        ListHeaderComponent={
          <View>
            <HomeHeader />

            <AppText style={styles.greeting} variant="displayLarge">
              Tarzına uygun berberi keşfet.
            </AppText>
            <AppText color="textMuted" style={styles.subtitle}>
              Hizmeti, berberi ve sana uygun saati tek yerden seç.
            </AppText>

            <HomeHeroCard onExplorePress={() => undefined} />

            <BarbershopSearch
              onChangeText={setSearchText}
              onSubmit={submitSearch}
              value={searchText}
            />
            <SectionHeader
              actionLabel={submittedSearch ? undefined : 'Tümünü gör'}
              onActionPress={submittedSearch ? undefined : () => void loadBarbershops()}
              title={submittedSearch ? `“${submittedSearch}” için sonuçlar` : 'Öne çıkan berberler'}
            />
          </View>
        }
        renderItem={({ item }) => <BarbershopCard barbershop={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <AppText color="textMuted" style={styles.emptyText}>
              {error ?? 'Henüz gösterilecek bir işletme yok.'}
            </AppText>
          )
        }
      />
    </Screen>
  );
}

function BarbershopCard({ barbershop }: { barbershop: PublicBarbershop }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.avatar}>
        <AppText color="primary" variant="displayMedium">
          {barbershop.name.slice(0, 1).toUpperCase()}
        </AppText>
      </View>
      <View style={styles.cardContent}>
        <AppText variant="label">{barbershop.name}</AppText>
        <AppText color="textMuted" numberOfLines={2} style={styles.cardDescription} variant="bodySmall">
          {barbershop.description || 'Randevu için profili incele.'}
        </AppText>
        {barbershop.address ? (
          <AppText color="primary" style={styles.address} variant="bodySmall">
            {barbershop.address}
          </AppText>
        ) : null}
      </View>
      <AppText color="textMuted" variant="displayMedium">
        ›
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  greeting: { marginTop: spacing.xl, maxWidth: 330 },
  subtitle: { marginTop: spacing.sm },
  card: { alignItems: 'center', flexDirection: 'row', minHeight: 104 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 56,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 56,
  },
  cardContent: { flex: 1 },
  cardDescription: { marginTop: spacing.xxs },
  address: { marginTop: 6 },
  separator: { height: spacing.xs },
  loader: { marginTop: spacing.xxl },
  emptyText: { paddingTop: spacing.sm, textAlign: 'center' },
});
