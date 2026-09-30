import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { getMyHaircutHistory } from '@/features/haircut-history/api';
import type { CustomerHaircutRecord } from '@/features/haircut-history/types';
import { getFavoriteStyles } from '@/features/favorites/api';
import type { FavoriteStyle } from '@/features/favorites/types';
import { ProfileSavedStyles } from '@/features/profile/components/ProfileSavedStyles';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function ProfileHistoryScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const themeColors = useThemeColors();
  const { token } = useAuth();
  const [records, setRecords] = useState<CustomerHaircutRecord[]>([]);
  const [favoriteStyles, setFavoriteStyles] = useState<FavoriteStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async (refreshing = false) => {
    if (!token) return;

    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [nextRecords, nextFavoriteStyles] = await Promise.all([
        getMyHaircutHistory(token),
        getFavoriteStyles(token),
      ]);
      setRecords(nextRecords);
      setFavoriteStyles(nextFavoriteStyles);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Tıraş geçmişi yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  if (!token) return null;

  function goBack() {
    goBackOrReplace(router, returnTo === 'customer-home' ? '/(tabs)' : '/(tabs)/profile');
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[themeColors.primary]}
            onRefresh={() => void loadHistory(true)}
            refreshing={isRefreshing}
            tintColor={themeColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <SettingsPageHeader onBackPress={goBack} title="Kaydettiğim Stiller" />

        {isLoading ? <ActivityIndicator color={themeColors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? (
          <AppText color="danger" style={styles.error} variant="bodySmall">{error}</AppText>
        ) : null}
        {!isLoading && !error ? (
          <>
            <ProfileSavedStyles
              accessToken={token}
              favoriteStyles={favoriteStyles}
              records={records}
            />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  error: { marginTop: spacing.xl, textAlign: 'center' },
});
