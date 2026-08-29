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
        <StatusBar style="dark" />
        <RootNavigator />
      </BusinessProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isReady, user } = useAuth();
  const { isReady: isBusinessReady } = useBusiness();

  useEffect(() => {
    if (isReady && isBusinessReady) void SplashScreen.hideAsync();
  }, [isBusinessReady, isReady]);

  if (!isReady || !isBusinessReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="auth" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" />
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
