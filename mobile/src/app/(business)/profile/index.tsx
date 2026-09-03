import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicBarbershop } from '@/features/barbershops/api';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { ActiveBusinessCard } from '@/features/business-profile/components/ActiveBusinessCard';
import { BusinessPlusPreviewCard } from '@/features/business-profile/components/BusinessPlusPreviewCard';
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
  const { activeMembership, can, memberships } = useBusiness();
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

  function showComingSoon(feature: string) {
    Alert.alert(`${feature} yakında`, 'Bu özelliği sağlam bir altyapıyla hazırlayıp aktif edeceğiz.');
  }

  const quickActions: ProfileMenuItem[] = [
    {
      icon: { ios: 'bell', android: 'notifications', web: 'notifications' },
      id: 'notifications',
      label: 'Bildirimler',
      onPress: () => router.push('/notifications'),
    },
    ...(can('MANAGE_BOOKING_SETTINGS')
      ? [{
          icon: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
          id: 'customer-invite-code',
          label: 'Müşteri Davet Kodum',
          onPress: () => router.push('/management/access'),
        } satisfies ProfileMenuItem]
      : []),
    ...(can('INVITE_MEMBERS')
      ? [{
          icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
          id: 'employee-invite-code',
          label: 'Çalışan Davet Kodum',
          onPress: () => router.push('/management/members/invite'),
        } satisfies ProfileMenuItem]
      : []),
    {
      badge: 'YAKINDA',
      icon: { ios: 'crown', android: 'workspace_premium', web: 'workspace_premium' },
      id: 'subscription',
      label: 'Abonelik / Plan',
      onPress: () => showComingSoon('Trimly Plus'),
    },
    {
      icon: { ios: 'headphones', android: 'support_agent', web: 'support_agent' },
      id: 'support',
      label: 'Yardım & Destek',
      onPress: () => showComingSoon('Yardım ve destek merkezi'),
    },
  ];

  const accountActions: ProfileMenuItem[] = [
    {
      icon: { ios: 'person.crop.circle', android: 'manage_accounts', web: 'manage_accounts' },
      id: 'account-settings',
      label: 'Hesap Ayarları',
      onPress: () => router.push('/(business)/profile/settings'),
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
          onPress={() => router.push('/(business)/profile/settings')}
          user={user}
        />
        <ActiveBusinessCard
          address={business?.address}
          isDiscoverable={business?.isDiscoverable}
          name={business?.name ?? activeMembership.barbershop.name}
          onPress={can('MANAGE_BUSINESS_PROFILE')
            ? () => router.push('/(business)/management/business')
            : undefined}
          profileImageUrl={business?.profileImageUrl ?? activeMembership.barbershop.profileImageUrl}
        />
        <ProfileMenuGroup items={quickActions} title="Profil Kısayolları" />
        <BusinessPlusPreviewCard onPress={() => showComingSoon('Trimly Plus')} />
        <ProfileMenuGroup items={accountActions} title="Hesap & Mod" />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
});
