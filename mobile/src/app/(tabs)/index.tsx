import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getMyAppointments } from '@/features/appointments/api';
import type { CustomerAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicBarbershops } from '@/features/barbershops/api';
import type { PublicBarbershop } from '@/features/barbershops/types';
import {
  addFavoriteBarbershop,
  getFavoriteBarbershops,
  removeFavoriteBarbershop,
} from '@/features/favorites/api';
import { FeaturedBarbershopCard } from '@/features/home/components/FeaturedBarbershopCard';
import { HomeGreeting } from '@/features/home/components/HomeGreeting';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { HomeHeroCard } from '@/features/home/components/HomeHeroCard';
import {
  HomeQuickActions,
  type HomeQuickAction,
} from '@/features/home/components/HomeQuickActions';
import { NextAppointmentCard } from '@/features/home/components/NextAppointmentCard';
import { RepeatLastTrimCard } from '@/features/home/components/RepeatLastTrimCard';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function HomeScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [barbershops, setBarbershops] = useState<PublicBarbershop[]>([]);
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [referenceTime, setReferenceTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHome = useCallback(async (refreshing = false) => {
    if (!token) return;

    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [nextBarbershops, nextAppointments, favorites] = await Promise.all([
        getPublicBarbershops(),
        getMyAppointments(token),
        getFavoriteBarbershops(token),
      ]);

      setBarbershops(nextBarbershops);
      setAppointments(nextAppointments);
      setFavoriteIds(favorites.map(({ barbershop }) => barbershop.id));
      setReferenceTime(Date.now());
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Ana sayfa yüklenemedi.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadHome();
    }, [loadHome]),
  );

  const nextAppointment = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === 'CONFIRMED' &&
            new Date(appointment.startsAt).getTime() >= referenceTime,
        )
        .sort((first, second) => first.startsAt.localeCompare(second.startsAt))[0] ?? null,
    [appointments, referenceTime],
  );
  const lastCompletedAppointment = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.status === 'COMPLETED')
        .sort((first, second) => second.startsAt.localeCompare(first.startsAt))[0] ?? null,
    [appointments],
  );

  if (!user) return null;

  function openNextAppointment(appointment: CustomerAppointment | null) {
    if (!appointment) {
      router.push('/barbers');
      return;
    }

    router.push({
      pathname: '/appointments/[appointmentId]',
      params: { appointmentId: appointment.id },
    });
  }

  async function toggleFavorite(barbershopId: string) {
    if (!token) return;

    const wasFavorite = favoriteIds.includes(barbershopId);
    setFavoriteIds((current) =>
      wasFavorite
        ? current.filter((favoriteId) => favoriteId !== barbershopId)
        : [...current, barbershopId],
    );

    try {
      if (wasFavorite) await removeFavoriteBarbershop(barbershopId, token);
      else await addFavoriteBarbershop(barbershopId, token);
    } catch (reason: unknown) {
      setFavoriteIds((current) =>
        wasFavorite
          ? [...new Set([...current, barbershopId])]
          : current.filter((favoriteId) => favoriteId !== barbershopId),
      );
      setError(reason instanceof Error ? reason.message : 'Favori işlemi yapılamadı.');
    }
  }

  const quickActions: HomeQuickAction[] = [
    {
      description: favoriteIds.length ? `${favoriteIds.length} kayıtlı işletmen` : 'Beğendiğin işletmeler',
      icon: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
      id: 'favorites',
      label: 'Favori Berberlerin',
      onPress: () => router.push('/favorites'),
    },
    {
      description: 'Konumuna göre keşfet',
      icon: { ios: 'location.fill', android: 'near_me', web: 'near_me' },
      id: 'nearby',
      label: 'Yakındaki Berberler',
      onPress: () => router.push('/barbers'),
    },
    {
      description: nextAppointment ? 'Detayını hızlıca gör' : 'Yeni randevu planla',
      icon: { ios: 'calendar.badge.clock', android: 'event', web: 'event' },
      id: 'next-appointment',
      label: 'En Yakın Randevu',
      onPress: () => openNextAppointment(nextAppointment),
    },
    {
      description: 'Stil arşivi yakında',
      icon: { ios: 'photo.stack', android: 'photo_library', web: 'photo_library' },
      id: 'saved-styles',
      label: 'Kaydettiğin Stiller',
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadHome(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <HomeHeader onNotificationsPress={() => router.push('/notifications')} />
        <HomeGreeting user={user} />

        <NextAppointmentCard
          appointment={nextAppointment}
          onPress={() => openNextAppointment(nextAppointment)}
        />

        <HomeHeroCard onExplorePress={() => router.push('/barbers')} />

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? (
          <AppText color="danger" style={styles.errorText} variant="bodySmall">{error}</AppText>
        ) : null}

        <SectionHeader title="Senin için" />
        <HomeQuickActions actions={quickActions} />

        <SectionHeader
          actionLabel="Tümünü gör"
          onActionPress={() => router.push('/barbers')}
          title="Öne Çıkan Berberler"
        />
        {barbershops.length ? (
          <ScrollView
            contentContainerStyle={styles.featuredList}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {barbershops.slice(0, 6).map((barbershop) => (
              <FeaturedBarbershopCard
                barbershop={barbershop}
                isFavorite={favoriteIds.includes(barbershop.id)}
                key={barbershop.id}
                onFavoritePress={() => void toggleFavorite(barbershop.id)}
                onPress={() => router.push(`/barbers/${barbershop.slug}`)}
              />
            ))}
          </ScrollView>
        ) : !isLoading ? (
          <AppText color="textMuted">Henüz öne çıkan işletme bulunmuyor.</AppText>
        ) : null}

        <RepeatLastTrimCard
          appointment={lastCompletedAppointment}
          onPress={() =>
            lastCompletedAppointment
              ? router.push({
                  pathname: '/book',
                  params: {
                    memberId: lastCompletedAppointment.businessMember.id,
                    serviceId: lastCompletedAppointment.serviceId,
                    slug: lastCompletedAppointment.barbershop.slug,
                  },
                })
              : router.push('/barbers')
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.lg },
  errorText: { marginTop: spacing.md, textAlign: 'center' },
  featuredList: { gap: spacing.sm, paddingRight: spacing.lg },
});
