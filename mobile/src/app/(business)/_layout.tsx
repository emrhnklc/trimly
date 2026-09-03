import { Tabs } from 'expo-router';

import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessRolePendingScreen } from '@/features/business/components/BusinessRolePendingScreen';
import { BusinessTabBar } from '@/features/business/components/BusinessTabBar';

export default function BusinessModeLayout() {
  const { activeMembership, can } = useBusiness();

  if (!activeMembership) return null;
  if (!can('ACCESS_BUSINESS_MODE')) return <BusinessRolePendingScreen />;

  return (
    <Tabs
      initialRouteName={can('VIEW_OWN_APPOINTMENTS') ? 'index' : 'calendar'}
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BusinessTabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{ href: can('VIEW_OWN_APPOINTMENTS') ? undefined : null }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ href: can('VIEW_OWN_SCHEDULE') ? undefined : null }}
      />
      <Tabs.Screen
        name="services"
        options={{ href: can('VIEW_SERVICE_CATALOG') ? undefined : null }}
      />
      <Tabs.Screen
        name="customers"
        options={{ href: can('VIEW_CUSTOMERS') ? undefined : null }}
      />
      <Tabs.Screen
        name="management"
        options={{ href: can('MANAGE_SERVICES') ? undefined : null }}
      />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
