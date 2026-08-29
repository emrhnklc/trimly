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
    <AuthProvider>
      <BusinessProvider>
        <AppModeProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </AppModeProvider>
      </BusinessProvider>
    </AuthProvider>
  );
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
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="barbers/[slug]" />
        <Stack.Screen name="appointments/preview" />
        <Stack.Screen name="appointments/[appointmentId]" />
        <Stack.Screen name="favorites" />
      </Stack.Protected>
    </Stack>
  );
}
