import { useCallback, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getFavoriteBarbershops } from '@/features/favorites/api';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import { getMyHaircutHistory } from '@/features/haircut-history/api';
import type { CustomerHaircutRecord } from '@/features/haircut-history/types';
import { ProfileFavoriteBarbershops } from '@/features/profile/components/ProfileFavoriteBarbershops';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileIdentity } from '@/features/profile/components/ProfileIdentity';
import { ProfileMembershipCard } from '@/features/profile/components/ProfileMembershipCard';
import { ProfileQuickActions } from '@/features/profile/components/ProfileQuickActions';
import { ProfileSavedStyles } from '@/features/profile/components/ProfileSavedStyles';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileOverviewScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [favorites, setFavorites] = useState<FavoriteBarbershop[]>([]);
  const [haircutRecords, setHaircutRecords] = useState<CustomerHaircutRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (refreshing = false) => {
    if (!token) return;

    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [nextFavorites, nextHaircutRecords] = await Promise.all([
        getFavoriteBarbershops(token),
        getMyHaircutHistory(token),
      ]);
      setFavorites(nextFavorites);
      setHaircutRecords(nextHaircutRecords);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Profil bilgileri yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
      void loadProfile();
    }, [loadProfile]),
  );

  if (!user || !token) return null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        ref={scrollRef}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadProfile(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <ProfileHeader onSettingsPress={() => router.push('/profile/settings')} />
        <ProfileIdentity onEditPress={() => router.push('/profile/edit')} user={user} />
        <ProfileMembershipCard />

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? (
          <AppText color="danger" style={styles.error} variant="bodySmall">{error}</AppText>
        ) : null}

        <ProfileSavedStyles accessToken={token} records={haircutRecords} />
        <ProfileFavoriteBarbershops
          favorites={favorites}
          onBarbershopPress={(slug) => router.push(`/barbers/${slug}`)}
          onViewAllPress={() => router.push('/favorites')}
        />
        <ProfileQuickActions
          actions={[
            {
              icon: { ios: 'bell', android: 'notifications', web: 'notifications' },
              id: 'notifications',
              label: 'Bildirimler',
            },
            {
              icon: { ios: 'gearshape', android: 'settings', web: 'settings' },
              id: 'settings',
              label: 'Hesap Ayarları',
              onPress: () => router.push('/profile/settings'),
            },
            {
              icon: { ios: 'heart', android: 'favorite_border', web: 'favorite_border' },
              id: 'favorites',
              label: 'Favorilerim',
              onPress: () => router.push('/favorites'),
            },
            {
              icon: { ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' },
              id: 'help',
              label: 'Yardım & Destek',
            },
          ]}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.lg },
  error: { marginTop: spacing.md, textAlign: 'center' },
});
