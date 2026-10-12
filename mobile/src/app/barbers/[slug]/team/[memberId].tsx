import { useCallback, useRef, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { BusinessDetailHeader } from "@/features/business/components/BusinessDetailHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { getPublicBarbershop } from "@/features/barbershops/api";
import {
  getPublicMemberProfile,
  type PublicMemberProfile,
} from "@/features/business-members/profile-api";
import { PublicMemberProfileContent } from "@/features/business-members/components/PublicMemberProfileContent";
import { goBackOrReplace } from "@/lib/navigation/goBackOrReplace";
import { spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export default function PublicBarberProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { slug, memberId } = useLocalSearchParams<{
    slug: string;
    memberId: string;
  }>();
  const { token } = useAuth();
  const [profile, setProfile] = useState<PublicMemberProfile | null>(null);
  const [shop, setShop] = useState<{
    id: string;
    name: string;
    isBookingOpen: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const loadProfile = useCallback(async () => {
    const request = ++requestVersion.current;
    setProfile(null);
    setShop(null);
    setError(null);
    if (!token) {
      setError("Berber profilini görmek için giriş yapmalısın.");
      return;
    }
    try {
      const business = await getPublicBarbershop(slug);
      const member = await getPublicMemberProfile(business.id, memberId, token);
      if (request !== requestVersion.current) return;
      setShop(business);
      setProfile(member);
    } catch (reason) {
      if (request === requestVersion.current)
        setError(
          reason instanceof Error ? reason.message : "Profil yüklenemedi.",
        );
    }
  }, [slug, memberId, token]);
  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      return () => {
        ++requestVersion.current;
      };
    }, [loadProfile]),
  );
  const bookable = Boolean(
    profile?.isBookable &&
    shop?.isBookingOpen &&
    profile.serviceAssignments.length,
  );
  function book(serviceId?: string) {
    router.push({
      pathname: "/book",
      params: { slug, memberId, ...(serviceId ? { serviceId } : {}) },
    });
  }
  return (
    <Screen>
      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <BusinessDetailHeader
            title="Berber Profili"
            onBack={() => goBackOrReplace(router, `/barbers/${slug}`)}
          />
          {error ? (
            <AppCard style={styles.card}>
              <AppText color="danger">{error}</AppText>
              <AppButton onPress={() => void loadProfile()}>
                Tekrar Dene
              </AppButton>
            </AppCard>
          ) : null}
          {!profile && !error ? (
            <AppText color="textMuted">Berber profili yükleniyor…</AppText>
          ) : null}
          {profile && shop ? (
            <PublicMemberProfileContent
              profile={profile}
              shop={shop}
              bookable={bookable}
            />
          ) : null}
        </ScrollView>
        {profile ? (
          <SafeAreaView
            edges={["bottom"]}
            style={[
              styles.footer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppButton disabled={!bookable} onPress={() => book()}>
              {bookable ? "Bu Berberden Randevu Al  →" : "Randevuya Kapalı"}
            </AppButton>
          </SafeAreaView>
        ) : null}
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  card: { gap: spacing.sm },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
