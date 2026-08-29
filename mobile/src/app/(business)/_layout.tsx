import { Tabs } from 'expo-router';

import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessRolePendingScreen } from '@/features/business/components/BusinessRolePendingScreen';
import { BusinessTabBar } from '@/features/business/components/BusinessTabBar';

export default function BusinessModeLayout() {
  const { activeMembership } = useBusiness();

  if (!activeMembership) return null;
  if (activeMembership.role !== 'OWNER') return <BusinessRolePendingScreen />;

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BusinessTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="calendar" />
      <Tabs.Screen name="customers" />
      <Tabs.Screen name="management" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
