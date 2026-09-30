import { Tabs } from 'expo-router';
import { useEffect } from 'react';

import { TrimlyTabBar } from '@/components/navigation/TrimlyTabBar';
import { getMyAppointments } from '@/features/appointments/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicBarbershops } from '@/features/barbershops/api';
import { getFavoriteBarbershops } from '@/features/favorites/api';
import { getMyHaircutHistory } from '@/features/haircut-history/api';

export default function TabLayout() {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    void Promise.allSettled([
      getPublicBarbershops(),
      getMyAppointments(token),
      getFavoriteBarbershops(token),
      getMyHaircutHistory(token),
    ]);
  }, [token]);

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <TrimlyTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="barbers" />
      <Tabs.Screen name="book" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="profile" options={{ popToTopOnBlur: true }} />
    </Tabs>
  );
}
