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
import { layout, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { isApiErrorCode } from "@/lib/api/client";
import { BarbershopReviewsSection } from "@/features/reviews/components/BarbershopReviewsSection";
import { getActiveBarbershopCampaigns } from "@/features/campaigns/api";
import { CampaignCard } from "@/features/campaigns/components/CampaignCard";
import type { Campaign } from "@/features/campaigns/types";

export default function BarbershopProfileScreen() {
  const [showAllServices, setShowAllServices] = useState(false);
  const [showAllTeam, setShowAllTeam] = useState(false);
  const router = useRouter();
  const themeColors = useThemeColors();
  const { token } = useAuth();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const [barbershop, setBarbershop] = useState<PublicBarbershopDetail | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          setCampaigns(
            await getActiveBarbershopCampaigns(loadedBarbershop.id, token),
          );
        } catch {
          setCampaigns([]);
        }
      } else {
        setCampaigns([]);
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
          <BarbershopHero barbershop={barbershop} />
          <BarbershopInfoCard barbershop={barbershop} />

          {!barbershop.isBookingOpen ? (
            <AppCard style={styles.bookingClosedCard}>
              <View
                style={[
                  styles.closedIcon,
                  { backgroundColor: themeColors.surfaceMuted },
                ]}
              >
                <SymbolView
                  name={{ ios: "clock", android: "schedule", web: "schedule" }}
                  size={29}
                  tintColor={themeColors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppText color="primary" variant="cardTitle">
                  Şu anda randevuya kapalı
                </AppText>
                <AppText
                  color="textMuted"
                  style={styles.bookingClosedText}
                  variant="bodySmall"
                >
                  Bu işletme şu anda yeni randevu kabul etmiyor. Mevcut
                  randevular geçerliliğini korur.
                </AppText>
              </View>
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
              <ProfileSection
                title="Hizmetler"
                action={
                  barbershop.services.length > 4
                    ? showAllServices
                      ? "Daha Az Göster"
                      : "Tümünü Gör"
                    : undefined
                }
                onAction={() => setShowAllServices((value) => !value)}
              >
                <BarbershopServiceTags
                  services={
                    showAllServices
                      ? barbershop.services
                      : barbershop.services.slice(0, 4)
                  }
                  disabled={!canBook}
                  onServicePress={(serviceId) =>
                    router.push({
                      pathname: "/book",
                      params: { slug: barbershop.slug, serviceId },
                    })
                  }
                />
              </ProfileSection>

              {campaigns.length ? (
                <ProfileSection title="Kampanyalar">
                  <View style={styles.campaigns}>
                    {campaigns.map((campaign) => (
                      <CampaignCard
                        campaign={campaign}
                        key={campaign.id}
                        onPress={
                          campaign.campaignType === "LOYALTY" &&
                          !campaign.customerProgress?.isEligible
                            ? undefined
                            : () =>
                                router.push({
                                  pathname: "/book",
                                  params: {
                                    campaignId: campaign.id,
                                    serviceId: campaign.services[0]?.service.id,
                                    slug: barbershop.slug,
                                  },
                                })
                        }
                      />
                    ))}
                  </View>
                </ProfileSection>
              ) : null}

              <ProfileSection
                title="Ekibimiz"
                action={
                  barbershop.members.length > 2
                    ? showAllTeam
                      ? "Daha Az Göster"
                      : "Tüm Ekibi Gör"
                    : undefined
                }
                onAction={() => setShowAllTeam((value) => !value)}
              >
                {barbershop.members.length ? (
                  <View style={styles.teamGrid}>
                    {barbershop.members
                      .slice(0, showAllTeam ? undefined : 2)
                      .map((barber) => (
                        <View
                          key={barber.id}
                          style={styles.teamCell}
                        >
                          <BarberPreviewCard
                            barber={barber}
                            compact
                            isBookingOpen={barbershop.isBookingOpen}
                            key={barber.id}
                            onPress={() =>
                              router.push({
                                pathname: "/barbers/[slug]/team/[memberId]",
                                params: {
                                  memberId: barber.id,
                                  slug: barbershop.slug,
                                },
                              })
                            }
                          />
                        </View>
                      ))}
                  </View>
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
                <AppCard style={styles.aboutCard}>
                  <View
                    style={[
                      styles.aboutIcon,
                      { backgroundColor: themeColors.surfaceMuted },
                    ]}
                  >
                    <SymbolView
                      name={{
                        ios: "doc.text.fill",
                        android: "description",
                        web: "description",
                      }}
                      size={23}
                      tintColor={themeColors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ExpandableDescription
                      description={barbershop.description}
                    />
                  </View>
                </AppCard>
              </ProfileSection>

              <ProfileSection title="Mekân & Tıraşlar">
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
                ]}
              >
                <SymbolView
                  name={{
                    ios: "calendar",
                    android: "calendar_month",
                    web: "calendar_month",
                  }}
                  size={20}
                  tintColor={themeColors.onPrimary}
                />
                <AppText color="onPrimary" variant="cardTitle">
                  {barbershop.isBookingOpen ? "Randevu Al" : "Randevuya Kapalı"}
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
  subtitle,
  action,
  onAction,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <AppText
          style={[styles.sectionTitle, { flex: 1 }]}
          variant="sectionTitle"
        >
          {title}
        </AppText>
        {action ? (
          <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
            <AppText color="primary" variant="bodySmall">
              {action} ›
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <AppText
          color="textMuted"
          variant="bodySmall"
          style={styles.sectionSubtitle}
        >
          {subtitle}
        </AppText>
      ) : null}
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
  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.xs,
  },
  teamCell: { width: "49%", minWidth: 0 },
  aboutCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
  },
  aboutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
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
  bookingClosedCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  closedIcon: {
    width: 54,
    height: 64,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeading: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  sectionSubtitle: { marginTop: -spacing.xs, marginBottom: spacing.sm },
  bookingClosedText: { lineHeight: 19, marginTop: spacing.xs },
  section: { marginTop: spacing.md },
  sectionTitle: { marginBottom: spacing.sm },
  campaigns: { gap: spacing.sm },
  description: { lineHeight: 22 },
  descriptionAction: { marginTop: spacing.xs },
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
