import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppIconButton } from "@/components/ui/AppIconButton";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import {
  getActiveServices,
  getPublicBarbershop,
  redeemBarbershopAccess,
} from "@/features/barbershops/api";
import { BarberPreviewCard } from "@/features/barbershops/components/BarberPreviewCard";
import { BarbershopAccessCard } from "@/features/barbershops/components/BarbershopAccessCard";
import { BarbershopEmptyState } from "@/features/barbershops/components/BarbershopEmptyState";
import { BarbershopWorkShowcase } from "@/features/barbershops/components/BarbershopWorkShowcase";
import { BarbershopHero } from "@/features/barbershops/components/BarbershopHero";
import { BarbershopInfoCard } from "@/features/barbershops/components/BarbershopInfoCard";
import { BarbershopServiceTags } from "@/features/barbershops/components/BarbershopServiceTags";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  addFavoriteBarbershop,
  getFavoriteBarbershops,
  removeFavoriteBarbershop,
} from "@/features/favorites/api";
import { layout, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { isApiErrorCode } from "@/lib/api/client";
import { BarbershopReviewsSection } from "@/features/reviews/components/BarbershopReviewsSection";
import { getActiveBarbershopCampaigns } from "@/features/campaigns/api";
import { CampaignCard } from "@/features/campaigns/components/CampaignCard";
import type { Campaign } from "@/features/campaigns/types";

export default function BarbershopProfileScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { token } = useAuth();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [barbershop, setBarbershop] = useState<PublicBarbershopDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [hasBookingAccess, setHasBookingAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isAccessSubmitting, setIsAccessSubmitting] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const loadBarbershop = useCallback(async () => {
    if (!slug) {
      setError("İşletme profil bağlantısı geçersiz.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setFavoriteError(null);
    setAccessError(null);

    try {
      let loadedBarbershop = await getPublicBarbershop(slug);
      let canLoadCampaigns = loadedBarbershop.accessMode !== "CODE_REQUIRED";

      if (loadedBarbershop.accessMode === "CODE_REQUIRED") {
        if (!token) {
          setHasBookingAccess(false);
        } else {
          try {
            const services = await getActiveServices(
              loadedBarbershop.id,
              token,
            );
            loadedBarbershop = { ...loadedBarbershop, services };
            setHasBookingAccess(true);
            canLoadCampaigns = true;
          } catch (reason) {
            if (!isApiErrorCode(reason, "BARBERSHOP_ACCESS_REQUIRED"))
              throw reason;
            setHasBookingAccess(false);
          }
        }
      } else {
        setHasBookingAccess(true);
      }

      setBarbershop(loadedBarbershop);

      if (token && canLoadCampaigns) {
        try {
          setCampaigns(await getActiveBarbershopCampaigns(loadedBarbershop.id, token));
        } catch {
          setCampaigns([]);
        }
      } else {
        setCampaigns([]);
      }

      if (token) {
        setIsFavoriteLoading(true);

        try {
          const favorites = await getFavoriteBarbershops(token);
          setIsFavorite(
            favorites.some(
              ({ barbershop: favorite }) => favorite.id === loadedBarbershop.id,
            ),
          );
        } catch (reason: unknown) {
          setFavoriteError(
            reason instanceof Error
              ? reason.message
              : "Favori durumu alınamadı.",
          );
        } finally {
          setIsFavoriteLoading(false);
        }
      }
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "İşletme yüklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [slug, token]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadBarbershop(), 0);
    return () => clearTimeout(requestId);
  }, [loadBarbershop]);

  async function shareBarbershop() {
    if (!barbershop) return;

    await Share.share({
      message: `${barbershop.name} işletmesini Trimly'de keşfet: trimly://barbers/${barbershop.slug}`,
      title: barbershop.name,
    });
  }

  async function toggleFavorite() {
    if (!barbershop || !token || isFavoriteLoading) return;

    setIsFavoriteLoading(true);
    setFavoriteError(null);

    try {
      if (isFavorite) {
        await removeFavoriteBarbershop(barbershop.id, token);
        setIsFavorite(false);
      } else {
        await addFavoriteBarbershop(barbershop.id, token);
        setIsFavorite(true);
      }
    } catch (reason: unknown) {
      setFavoriteError(
        reason instanceof Error ? reason.message : "Favori işlemi yapılamadı.",
      );
    } finally {
      setIsFavoriteLoading(false);
    }
  }

  async function unlockBookingAccess(code: string) {
    if (!barbershop || !token || isAccessSubmitting) return;

    setIsAccessSubmitting(true);
    setAccessError(null);

    try {
      await redeemBarbershopAccess(barbershop.slug, code, token);
      await loadBarbershop();
    } catch (reason) {
      setAccessError(
        reason instanceof Error ? reason.message : "Erişim kodu doğrulanamadı.",
      );
    } finally {
      setIsAccessSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Screen>
        <ActivityIndicator color={themeColors.primary} style={styles.loader} />
      </Screen>
    );
  }

  if (error || !barbershop) {
    return (
      <Screen>
        <View style={styles.errorState}>
          <AppText color="danger" style={styles.centerText} variant="heading">
            İşletme yüklenemedi
          </AppText>
          <AppText color="textMuted" style={styles.errorDescription}>
            {error || "İşletme bulunamadı."}
          </AppText>
          <View style={styles.retryButton}>
            <AppButton
              onPress={() => void loadBarbershop()}
              variant="secondary"
            >
              Tekrar Dene
            </AppButton>
          </View>
        </View>
      </Screen>
    );
  }

  const canBook = Boolean(
    hasBookingAccess &&
      barbershop.isBookingOpen &&
      barbershop.services.length &&
      barbershop.members.length,
  );

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/barbers");
  }

  return (
    <Screen>
      <View style={styles.screenContent}>
        <View style={[styles.floatingAction, styles.backAction]}>
          <AppIconButton
            accessibilityLabel="Geri dön"
            icon={{
              ios: "chevron.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            onPress={goBack}
          />
        </View>
        <View style={[styles.floatingAction, styles.shareAction]}>
          <AppIconButton
            accessibilityLabel="İşletmeyi paylaş"
            icon={{
              ios: "square.and.arrow.up",
              android: "share",
              web: "share",
            }}
            onPress={() => void shareBarbershop()}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <BarbershopHero
            barbershop={barbershop}
            isFavorite={isFavorite}
            isFavoriteLoading={isFavoriteLoading}
            onFavoritePress={() => void toggleFavorite()}
          />
          {favoriteError ? (
            <AppText
              color="danger"
              style={styles.favoriteError}
              variant="bodySmall"
            >
              {favoriteError}
            </AppText>
          ) : null}
          <BarbershopInfoCard barbershop={barbershop} />

          {!barbershop.isBookingOpen ? (
            <AppCard style={styles.bookingClosedCard}>
              <AppText color="primary" variant="cardTitle">
                Şu anda randevuya kapalı
              </AppText>
              <AppText color="textMuted" style={styles.bookingClosedText} variant="bodySmall">
                Bu işletme şu anda yeni randevu kabul etmiyor. Mevcut randevular geçerliliğini korur.
              </AppText>
            </AppCard>
          ) : null}

          {!hasBookingAccess ? (
            <View style={styles.accessSection}>
              <BarbershopAccessCard
                barbershopName={barbershop.name}
                error={accessError}
                isSubmitting={isAccessSubmitting}
                onSubmit={unlockBookingAccess}
              />
            </View>
          ) : (
            <>
              <ProfileSection title="Hizmetler">
                <BarbershopServiceTags services={barbershop.services} />
              </ProfileSection>

              {campaigns.length ? (
                <ProfileSection title="Kampanyalar">
                  <View style={styles.campaigns}>
                    {campaigns.map((campaign) => (
                      <CampaignCard
                        campaign={campaign}
                        key={campaign.id}
                        onPress={campaign.campaignType === "LOYALTY" && !campaign.customerProgress?.isEligible ? undefined : () => router.push({
                          pathname: "/book",
                          params: {
                            campaignId: campaign.id,
                            serviceId: campaign.services[0]?.service.id,
                            slug: barbershop.slug,
                          },
                        })}
                      />
                    ))}
                  </View>
                </ProfileSection>
              ) : null}

              <ProfileSection title="Ekibimiz">
                {barbershop.members.length ? (
                  barbershop.members.map((barber) => (
                    <BarberPreviewCard
                      barber={barber}
                      key={barber.id}
                      onPress={() =>
                        router.push({
                          pathname: "/book",
                          params: { memberId: barber.id, slug: barbershop.slug },
                        })
                      }
                    />
                  ))
                ) : (
                  <BarbershopEmptyState
                    description="İşletme ekibi hazır olduğunda burada görünecek."
                    icon={{
                      ios: "person.2",
                      android: "group",
                      web: "group",
                    }}
                    title="Henüz randevuya açık çalışan yok"
                  />
                )}
              </ProfileSection>

              <ProfileSection title="Hakkında">
                <ExpandableDescription description={barbershop.description} />
              </ProfileSection>

              <ProfileSection title="Galeri ve Tıraşlar">
                <BarbershopWorkShowcase
                  barbershopId={barbershop.id}
                  galleryPhotos={barbershop.galleryPhotos}
                  slug={barbershop.slug}
                />
              </ProfileSection>

              <ProfileSection title="Yorumlar">
                <BarbershopReviewsSection barbershopId={barbershop.id} />
              </ProfileSection>
            </>
          )}
        </ScrollView>

        {hasBookingAccess ? (
          <SafeAreaView
            edges={["bottom"]}
            style={[
              styles.footerSafeArea,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Pressable
                accessibilityLabel="Randevu al"
                accessibilityRole="button"
                disabled={!canBook}
                onPress={() =>
                  router.push({
                    pathname: "/book",
                    params: { slug: barbershop.slug },
                  })
                }
                style={({ pressed }) => [
                  styles.bookButton,
                  { backgroundColor: themeColors.primary },
                  !canBook && styles.bookButtonDisabled,
                  pressed && canBook && styles.bookButtonPressed,
                ]}>
                <SymbolView
                  name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
                  size={20}
                  tintColor={themeColors.onPrimary}
                />
                <AppText color="onPrimary" variant="cardTitle">
                  {barbershop.isBookingOpen ? 'Randevu Al' : 'Randevuya Kapalı'}
                </AppText>
              </Pressable>
            </View>
          </SafeAreaView>
        ) : null}
      </View>
    </Screen>
  );
}

function ProfileSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="sectionTitle">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function ExpandableDescription({
  description,
}: {
  description: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const text =
    description || "Bu işletme henüz kendisi hakkında bir açıklama eklememiş.";
  const canExpand = text.length > 150;

  return (
    <View>
      <AppText
        color="textMuted"
        numberOfLines={isExpanded ? undefined : 3}
        style={styles.description}
      >
        {text}
      </AppText>
      {canExpand ? (
        <AppText
          color="primary"
          onPress={() => setIsExpanded((current) => !current)}
          style={styles.descriptionAction}
          variant="label"
        >
          {isExpanded ? "Daha az göster" : "Devamını gör"}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  errorState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  centerText: { textAlign: "center" },
  errorDescription: { marginTop: spacing.xs, textAlign: "center" },
  retryButton: { marginTop: spacing.xl, minWidth: 180 },
  screenContent: { flex: 1 },
  floatingAction: { position: "absolute", top: spacing.sm, zIndex: 3 },
  backAction: { left: spacing.lg },
  shareAction: { right: spacing.lg },
  content: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.xs,
  },
  accessSection: { marginTop: spacing.lg },
  bookingClosedCard: { marginTop: spacing.lg, padding: spacing.md },
  bookingClosedText: { lineHeight: 19, marginTop: spacing.xs },
  section: { marginTop: layout.sectionGap },
  sectionTitle: { marginBottom: spacing.sm },
  campaigns: { gap: spacing.sm },
  description: { lineHeight: 22 },
  descriptionAction: { marginTop: spacing.xs },
  favoriteError: { textAlign: "center" },
  footerSafeArea: {},
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  bookButton: {
    alignItems: "center",
    borderRadius: 18,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    minHeight: 54,
  },
  bookButtonDisabled: { opacity: 0.45 },
  bookButtonPressed: { opacity: 0.82 },
});
