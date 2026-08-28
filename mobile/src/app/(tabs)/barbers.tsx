import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { BarbershopPreviewCard } from '@/features/barbershops/components/BarbershopPreviewCard';
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

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={barbershops}
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
              Tarzına uygun berber dükkânını keşfet, hizmetleri ve çalışanları incele.
            </AppText>
            <BarbershopSearch
              onChangeText={setSearchText}
              onSubmit={submitSearch}
              value={searchText}
            />
            <View style={styles.resultsHeader}>
              <AppText variant="heading">
                {submittedSearch ? `“${submittedSearch}” sonuçları` : 'Tüm işletmeler'}
              </AppText>
              {!isLoading ? (
                <AppText color="primary" variant="bodySmall">{barbershops.length} sonuç</AppText>
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
  title: { marginTop: spacing.xl },
  subtitle: { marginTop: spacing.xs },
  resultsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xxl,
  },
  separator: { height: spacing.xs },
  loader: { marginTop: spacing.xxl },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  emptyTitle: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.xs, textAlign: 'center' },
});
