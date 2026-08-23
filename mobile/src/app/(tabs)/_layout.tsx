import { Tabs } from 'expo-router';

import { TrimlyTabBar } from '@/components/navigation/TrimlyTabBar';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TrimlyTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="barbers" />
      <Tabs.Screen name="book" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
