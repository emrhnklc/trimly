import { Stack } from 'expo-router';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { AppModeProvider, useAppMode } from '@/features/app-mode/AppModeProvider';
import { BusinessProvider, useBusiness } from '@/features/business/BusinessProvider';
import { PushNotificationsManager } from '@/features/notifications/PushNotificationsManager';
import { AppPreferencesProvider, useAppPreferences } from '@/features/preferences/AppPreferencesProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <BusinessProvider>
          <AppModeProvider>
            <PushNotificationsManager />
            <AppStatusBar />
            <RootNavigator />
          </AppModeProvider>
        </BusinessProvider>
      </AuthProvider>
    </AppPreferencesProvider>
  );
}

function AppStatusBar() {
  const { resolvedTheme } = useAppPreferences();
  return <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />;
}

function RootNavigator() {
  const { isReady, user } = useAuth();
  const { isReady: isAppModeReady, mode } = useAppMode();
  const { isReady: isBusinessReady } = useBusiness();

  useEffect(() => {
    if (isReady && isBusinessReady && isAppModeReady) void SplashScreen.hideAsync();
  }, [isAppModeReady, isBusinessReady, isReady]);

  if (!isReady || !isBusinessReady || !isAppModeReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="auth" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user) && mode === 'customer'}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user) && mode === 'business'}>
        <Stack.Screen name="(business)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="business" />
        <Stack.Screen name="business-access" />
        <Stack.Screen name="data-export" />
        <Stack.Screen name="account-delete" />
        <Stack.Screen name="application-settings" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="barbers/[slug]" />
        <Stack.Screen name="appointments/preview" />
        <Stack.Screen name="appointments/[appointmentId]" />
        <Stack.Screen name="business-appointments/[appointmentId]" />
        <Stack.Screen name="business-appointment-reschedule/[appointmentId]" />
        <Stack.Screen name="business-haircut-record/[appointmentId]" />
        <Stack.Screen name="business-haircut-camera/[appointmentId]" />
        <Stack.Screen name="business-customers/[customerId]" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="campaigns" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="password/change" />
        <Stack.Screen name="sessions" />
        <Stack.Screen name="profiles" />
      </Stack.Protected>

      <Stack.Screen name="legal/[document]" />
      <Stack.Screen name="access/[slug]" />
      <Stack.Screen name="join/[token]" />
    </Stack>
  );
}
