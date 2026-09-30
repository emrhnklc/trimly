import { Stack, useRouter } from "expo-router";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AuthProvider, useAuth } from "@/features/auth/AuthProvider";
import {
  AppModeProvider,
  useAppMode,
} from "@/features/app-mode/AppModeProvider";
import {
  BusinessProvider,
  useBusiness,
} from "@/features/business/BusinessProvider";
import { PushNotificationsManager } from "@/features/notifications/PushNotificationsManager";
import {
  AppPreferencesProvider,
  useAppPreferences,
} from "@/features/preferences/AppPreferencesProvider";

void SplashScreen.preventAutoHideAsync();

const profileBackgroundSources = [
  require("../../assets/images/profile-customer-hero.jpg"),
  require("../../assets/images/profile-last-haircut.jpg"),
];
let profileBackgroundPreload: Promise<unknown> | null = null;

function preloadProfileBackgrounds() {
  profileBackgroundPreload ??= Promise.all(
    profileBackgroundSources.map((source) => Image.loadAsync(source)),
  ).catch(() => undefined);
  return profileBackgroundPreload;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
  });

  useEffect(() => {
    void preloadProfileBackgrounds();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AppPreferencesProvider>
      <AuthProvider>
        <BusinessProvider>
          <AppModeProvider>
            <View style={styles.appShell}>
              <PushNotificationsManager />
              <AppStatusBar />
              <RootNavigator />
              <AuthTransitionOverlay />
            </View>
          </AppModeProvider>
        </BusinessProvider>
      </AuthProvider>
    </AppPreferencesProvider>
  );
}

function AppStatusBar() {
  const { resolvedTheme } = useAppPreferences();
  return <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />;
}

function RootNavigator() {
  const router = useRouter();
  const {
    authTransition,
    clearPostAuthRoute,
    finishAuthTransition,
    isReady,
    postAuthRoute,
    user,
  } = useAuth();
  const { isReady: isAppModeReady, mode } = useAppMode();
  const { isReady: isBusinessReady } = useBusiness();

  useEffect(() => {
    if (isReady && isBusinessReady && isAppModeReady)
      void SplashScreen.hideAsync();
  }, [isAppModeReady, isBusinessReady, isReady]);

  useEffect(() => {
    if (!isReady || !isBusinessReady || !isAppModeReady || !authTransition)
      return;

    if (authTransition === "signing-in") {
      if (!user || !postAuthRoute) return;

      const destination = postAuthRoute;
      clearPostAuthRoute();
      router.replace(destination);
    } else if (user) {
      return;
    }

    setTimeout(finishAuthTransition, 120);
  }, [
    authTransition,
    clearPostAuthRoute,
    finishAuthTransition,
    isAppModeReady,
    isBusinessReady,
    isReady,
    postAuthRoute,
    router,
    user,
  ]);

  if (!isReady || !isBusinessReady || !isAppModeReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="auth" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user) && mode === "customer"}>
        <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(user) && mode === "business"}>
        <Stack.Screen name="(business)" options={{ animation: "fade" }} />
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
        <Stack.Screen name="saved-styles" />
        <Stack.Screen name="dependents" />
      </Stack.Protected>

      <Stack.Screen name="legal/[document]" />
      <Stack.Screen name="access/[slug]" />
      <Stack.Screen name="join/[token]" />
    </Stack>
  );
}

function AuthTransitionOverlay() {
  const { isAuthTransitioning } = useAuth();
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(opacity, {
      duration: isAuthTransitioning ? 160 : 220,
      toValue: isAuthTransitioning ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [isAuthTransitioning, opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden={!isAuthTransitioning}
      importantForAccessibility={
        isAuthTransitioning ? "yes" : "no-hide-descendants"
      }
      pointerEvents={isAuthTransitioning ? "auto" : "none"}
      style={[styles.authTransition, { opacity }]}
    >
      <Image
        contentFit="cover"
        source={require("../../assets/images/trimly-splash.png")}
        style={styles.authTransitionImage}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  appShell: { flex: 1 },
  authTransition: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  authTransitionImage: {
    height: "100%",
    width: "100%",
  },
});
