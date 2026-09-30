import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { BarbershopPreviewCard } from '@/features/barbershops/components/BarbershopPreviewCard';
import { useAuth } from '@/features/auth/AuthProvider';
import { getFavoriteBarbershops } from '@/features/favorites/api';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import { spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function FavoritesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteBarbershop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(async (refresh = false) => {
    if (!token) return;

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      setFavorites(await getFavoriteBarbershops(token));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Favoriler yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [loadFavorites]),
  );

  return (
    <Screen>
      <FlatList
        contentContainerStyle={[styles.content, !favorites.length && styles.emptyContent]}
        data={favorites}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={({ barbershop }) => barbershop.id}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyTitle} variant="heading">
                {error ? 'Favoriler yüklenemedi' : 'Henüz favorin yok'}
              </AppText>
              <AppText color="textMuted" style={styles.emptyDescription}>
                {error ?? 'Beğendiğin dükkânları kalp simgesine dokunarak burada biriktirebilirsin.'}
              </AppText>
              <View style={styles.exploreButton}>
                <AppButton onPress={() => router.push('/barbers')} variant="secondary">
                  Berberleri Keşfet
                </AppButton>
              </View>
            </View>
          )
        }
        ListHeaderComponent={
          <SettingsPageHeader onBackPress={() => router.back()} title="Favori Berberlerim" />
        }
        refreshControl={
          <RefreshControl
            onRefresh={() => void loadFavorites(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <BarbershopPreviewCard
            barbershop={item.barbershop}
            onPress={() => router.push(`/barbers/${item.barbershop.slug}`)}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  emptyContent: { flexGrow: 1 },
  separator: { height: spacing.xs },
  loader: { marginTop: spacing.xxl },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyTitle: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.xs, textAlign: 'center' },
  exploreButton: { marginTop: spacing.xl, minWidth: 190 },
});
