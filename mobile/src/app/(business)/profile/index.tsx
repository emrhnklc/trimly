import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicBarbershop } from '@/features/barbershops/api';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { ActiveBusinessCard } from '@/features/business-profile/components/ActiveBusinessCard';
import { BusinessOwnerIdentity } from '@/features/business-profile/components/BusinessOwnerIdentity';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import {
  ProfileMenuGroup,
  type ProfileMenuItem,
} from '@/features/profile/components/ProfileMenuGroup';
import { spacing } from '@/theme/spacing';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { enterCustomerMode } = useAppMode();
  const { signOut, user } = useAuth();
  const { activeMembership, memberships } = useBusiness();
  const [business, setBusiness] = useState<PublicBarbershopDetail | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!activeMembership) return;

      let isActive = true;
      void getPublicBarbershop(activeMembership.barbershop.slug)
        .then((result) => {
          if (isActive) setBusiness(result);
        })
        .catch(() => {
          if (isActive) setBusiness(null);
        });

      return () => {
        isActive = false;
      };
    }, [activeMembership]),
  );

  if (!activeMembership || !user) return null;

  async function returnToCustomerMode() {
    await enterCustomerMode();
    router.replace('/(tabs)');
  }

  function confirmSignOut() {
    Alert.alert('Çıkış yapılsın mı?', 'Trimly hesabından çıkış yapacaksın.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  }

  const quickActions: ProfileMenuItem[] = [
    {
      icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
      id: 'working-hours',
      label: 'Çalışma Saatleri',
      onPress: () => router.push('/management/hours'),
    },
    {
      icon: { ios: 'storefront', android: 'storefront', web: 'storefront' },
      id: 'business-settings',
      label: 'İşletme Ayarları',
      onPress: () => router.push('/management/business'),
    },
    {
      icon: { ios: 'calendar.badge.clock', android: 'event_note', web: 'event_note' },
      id: 'booking-settings',
      label: 'Randevu Ayarları',
      onPress: () => router.push('/management/booking'),
    },
    {
      icon: { ios: 'person.2', android: 'group', web: 'group' },
      id: 'members',
      label: 'Çalışanlar',
      onPress: () => router.push('/management/members'),
    },
    {
      badge: 'YAKINDA',
      icon: { ios: 'bell', android: 'notifications', web: 'notifications' },
      id: 'notifications',
      label: 'Bildirim Ayarları',
    },
  ];

  const accountActions: ProfileMenuItem[] = [
    {
      icon: { ios: 'person.crop.circle', android: 'manage_accounts', web: 'manage_accounts' },
      id: 'account-settings',
      label: 'Hesap Ayarları',
      onPress: () => router.push('/profile/settings'),
    },
    {
      badge: memberships.length > 1 ? `${memberships.length} İŞLETME` : undefined,
      icon: { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' },
      id: 'switch-business',
      label: 'Aktif İşletmeyi Değiştir',
      onPress: () => router.push('/business/select'),
    },
    {
      icon: { ios: 'person', android: 'person_outline', web: 'person_outline' },
      id: 'customer-mode',
      label: 'Müşteri Moduna Dön',
      onPress: () => void returnToCustomerMode(),
    },
    {
      danger: true,
      icon: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
      id: 'logout',
      label: 'Çıkış Yap',
      onPress: confirmSignOut,
    },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessScreenHeader title="Profil" />
        <BusinessOwnerIdentity
          membership={activeMembership}
          onPress={() => router.push('/profile/settings')}
          user={user}
        />
        <ActiveBusinessCard
          address={business?.address}
          isDiscoverable={business?.isDiscoverable}
          name={business?.name ?? activeMembership.barbershop.name}
          onPress={() => router.push('/management/business')}
          profileImageUrl={business?.profileImageUrl ?? activeMembership.barbershop.profileImageUrl}
        />
        <ProfileMenuGroup items={quickActions} title="Hızlı İşlemler" />
        <ProfileMenuGroup items={accountActions} title="Hesap & Mod" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
});
