import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getMyHaircutHistory } from '@/features/haircut-history/api';
import type { CustomerHaircutRecord } from '@/features/haircut-history/types';
import { getFavoriteStyles } from '@/features/favorites/api';
import type { FavoriteStyle } from '@/features/favorites/types';
import { ProfileSavedStyles } from '@/features/profile/components/ProfileSavedStyles';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileHistoryScreen() {
  const router = useRouter();
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
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadHistory(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AppIconButton
            accessibilityLabel="Profile geri dön"
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            onPress={goBack}
            variant="transparent"
          />
          <AppText style={styles.title} variant="displayMedium">Kaydettiğim Stiller</AppText>
          <View style={styles.topBarSpacer} />
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  topBarSpacer: { width: 44 },
  title: { flex: 1, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
  error: { marginTop: spacing.xl, textAlign: 'center' },
});
