import { Image } from "expo-image";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { AppIconButton } from "@/components/ui/AppIconButton";
import { BrandedPageHeader } from "@/components/ui/BrandedPageHeader";
import { CachedImageBackground } from "@/components/ui/CachedImageBackground";
import { Screen } from "@/components/ui/Screen";
import { getBusinessAppointments } from "@/features/appointments/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { getPublicBarbershop } from "@/features/barbershops/api";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import { useBusiness } from "@/features/business/BusinessProvider";
import {
  businessRoleEnglishLabels,
  businessRoleLabels,
} from "@/features/business/role-labels";
import { useAppPreferences } from "@/features/preferences/AppPreferencesProvider";
import {
  ProfileMenuGroup,
  type ProfileMenuItem,
} from "@/features/profile/components/ProfileMenuGroup";
import { colors } from "@/theme/colors";
import { layout, radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { translate } = useAppPreferences();
  const { signOut, token, user } = useAuth();
  const { activeMembership, can, memberships } = useBusiness();
  const [business, setBusiness] = useState<PublicBarbershopDetail | null>(null);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!activeMembership) return;

      let isActive = true;
      void getPublicBarbershop(activeMembership.barbershop.slug)
        .then((result) => {
          if (isActive) setBusiness(result);
        })
        .catch(() => {
          if (isActive) setBusiness(null);
        });

      if (token) {
        void getBusinessAppointments(activeMembership.barbershop.id, token)
          .then((appointments) => {
            if (isActive) setAppointmentCount(appointments.length);
          })
          .catch(() => {
            if (isActive) setAppointmentCount(0);
          });
      }

      return () => {
        isActive = false;
      };
    }, [activeMembership, token]),
  );

  if (!activeMembership || !user) return null;

  function confirmSignOut() {
    Alert.alert("Çıkış yapılsın mı?", "Trimly hesabından çıkış yapacaksın.", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: () => void signOut(),
      },
    ]);
  }

  function showComingSoon(feature: string) {
    Alert.alert(
      `${feature} yakında`,
      "Bu özelliği sağlam bir altyapıyla hazırlayıp aktif edeceğiz.",
    );
  }

  const quickActions: ProfileMenuItem[] = [
    {
      icon: { ios: "bell", android: "notifications", web: "notifications" },
      id: "notifications",
      label: translate("Bildirimler", "Notifications"),
      onPress: () =>
        router.push({
          pathname: "/notifications",
          params: { returnTo: "business-profile" },
        }),
    },
    ...(can("MANAGE_BOOKING_SETTINGS")
      ? [
          {
            icon: { ios: "qrcode", android: "qr_code_2", web: "qr_code_2" },
            id: "invite-codes",
            label: translate("Davet Kodlarım", "My Invite Codes"),
            onPress: () =>
              router.push({
                pathname: "/business-access",
                params: { returnTo: "profile" },
              }),
          } satisfies ProfileMenuItem,
        ]
      : []),
    {
      icon: {
        ios: "crown",
        android: "workspace_premium",
        web: "workspace_premium",
      },
      id: "subscription",
      label: translate("Planım", "My Plan"),
      onPress: () => showComingSoon("Abonelik planları"),
    },
    {
      icon: {
        ios: "headphones",
        android: "support_agent",
        web: "support_agent",
      },
      id: "support",
      label: translate("Yardım", "Help"),
      onPress: () => showComingSoon("Yardım ve destek merkezi"),
    },
  ];

  const accountActions: ProfileMenuItem[] = [
    {
      icon: {
        ios: "person.crop.circle",
        android: "manage_accounts",
        web: "manage_accounts",
      },
      id: "account-settings",
      label: translate("Hesap Ayarları", "Account Settings"),
      onPress: () => router.push("/(business)/profile/settings"),
    },
    {
      icon: { ios: "bell", android: "notifications", web: "notifications" },
      id: "business-notifications",
      label: translate("İşletme Bildirimleri", "Business Notifications"),
      onPress: () =>
        router.push({
          pathname: "/notifications",
          params: { returnTo: "business-profile" },
        }),
    },
    {
      badge: "YAKINDA",
      icon: { ios: "creditcard", android: "credit_card", web: "credit_card" },
      id: "billing",
      label: translate("Abonelik & Fatura", "Subscription & Billing"),
      onPress: () => showComingSoon("Abonelik ve faturalandırma"),
    },
    {
      icon: { ios: "gearshape", android: "settings", web: "settings" },
      id: "application-settings",
      label: translate("Uygulama Ayarları", "App Settings"),
      onPress: () =>
        router.push({
          pathname: "/application-settings",
          params: { returnTo: "business-profile" },
        }),
    },
    {
      danger: true,
      icon: {
        ios: "rectangle.portrait.and.arrow.right",
        android: "logout",
        web: "logout",
      },
      id: "logout",
      label: translate("Çıkış Yap", "Sign Out"),
      onPress: confirmSignOut,
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BrandedPageHeader
          rightAccessory={
            <AppIconButton
              accessibilityLabel="Profillerimi aç"
              icon={{ ios: "person.2.fill", android: "group", web: "group" }}
              onPress={() =>
                router.push({
                  pathname: "/profiles",
                  params: { returnTo: "business-profile" },
                })
              }
              size={20}
              color="primary"
              variant="surface"
            />
          }
        />
        <CachedImageBackground
          imageStyle={styles.heroImage}
          source={require("../../../../assets/images/profile-customer-hero.jpg")}
          style={styles.hero}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroMain}>
            {user.profileImageUrl ? (
              <Image
                contentFit="cover"
                source={user.profileImageUrl}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <AppText
                  color="primary"
                  style={styles.initial}
                  variant="displayLarge"
                >
                  {user.firstName.slice(0, 1).toLocaleUpperCase("tr-TR")}
                </AppText>
              </View>
            )}
            <View style={styles.identity}>
              <AppText
                adjustsFontSizeToFit
                color="onPrimary"
                minimumFontScale={0.86}
                numberOfLines={2}
                style={styles.name}
                variant="displayMedium"
              >
                {user.firstName} {user.lastName}
              </AppText>
              <View style={styles.roleBadge}>
                <AppText color="primary" variant="label">
                  {translate(
                    businessRoleLabels[activeMembership.role],
                    businessRoleEnglishLabels[activeMembership.role],
                  )}
                </AppText>
              </View>
              <AppText
                color="onPrimary"
                numberOfLines={1}
                style={styles.shopName}
                variant="bodySmall"
              >
                {business?.name ?? activeMembership.barbershop.name}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Profili düzenle"
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: "/(business)/profile/edit",
                  params: { returnTo: "business-profile" },
                })
              }
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{ ios: "pencil", android: "edit", web: "edit" }}
                size={15}
                tintColor={colors.primary}
              />
              <AppText color="primary" variant="label">
                {translate("Düzenle", "Edit")}
              </AppText>
            </Pressable>
          </View>
        </CachedImageBackground>

        <View style={styles.statsRow}>
          <StatCard
            icon={{
              ios: "storefront",
              android: "storefront",
              web: "storefront",
            }}
            label={translate("İşletme", "Business")}
            value={memberships.length}
          />
          <StatCard
            icon={{ ios: "person.2", android: "groups", web: "groups" }}
            label={translate("Çalışan", "Employee")}
            value={business?.members.length ?? 0}
          />
          <StatCard
            icon={{
              ios: "calendar",
              android: "calendar_month",
              web: "calendar_month",
            }}
            label={translate("Randevu", "Appointment")}
            value={appointmentCount}
          />
        </View>

        <AppText style={styles.sectionTitle} variant="sectionTitle">
          {translate("Hızlı İşlemler", "Quick Actions")}
        </AppText>
        <View style={styles.quickGrid}>
          {quickActions.map((item) => (
            <QuickAction item={item} key={item.id} />
          ))}
        </View>
        <ProfileMenuGroup
          items={accountActions}
          title={translate("Ayarlar", "Settings")}
          titleStyle={styles.sectionTitle}
          titleVariant="sectionTitle"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 116,
    paddingHorizontal: layout.screenHorizontalPadding,
  },
  hero: { borderRadius: radius.card, minHeight: 164, overflow: "hidden" },
  heroImage: { borderRadius: radius.card },
  heroOverlay: {
    backgroundColor: "rgba(14, 9, 6, 0.46)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  heroMain: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 164,
    padding: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 68, width: 68 },
  avatarPlaceholder: {
    alignItems: "center",
    backgroundColor: "rgba(247,243,234,0.94)",
    justifyContent: "center",
  },
  initial: { fontSize: 30, lineHeight: 36 },
  identity: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  name: { fontSize: 23, lineHeight: 28 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(247,232,187,0.9)",
    borderRadius: radius.pill,
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  shopName: { fontSize: 12, lineHeight: 16, marginTop: spacing.xxs },
  editButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,252,247,0.92)",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  statCard: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flex: 1,
    gap: 0,
    justifyContent: "center",
    minHeight: 74,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  statIcon: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  statCopy: { alignItems: "center" },
  statValue: { fontSize: 18, lineHeight: 21 },
  statLabel: { textAlign: "center" },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginTop: layout.sectionGap },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickAction: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 72,
    padding: spacing.sm,
    width: "48%",
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  quickLabel: { flex: 1, fontSize: 12, lineHeight: 16, marginLeft: spacing.xs },
  disabled: { opacity: 0.66 },
  pressed: { opacity: 0.72 },
});

function StatCard({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: number;
}) {
  const themeColors = useThemeColors();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View
        style={[styles.statIcon, { backgroundColor: themeColors.background }]}
      >
        <SymbolView name={icon} size={19} tintColor={themeColors.primary} />
      </View>
      <View style={styles.statCopy}>
        <AppText style={styles.statValue} variant="heading">
          {value}
        </AppText>
        <AppText
          color="textMuted"
          numberOfLines={1}
          style={styles.statLabel}
          variant="bodySmall"
        >
          {label}
        </AppText>
      </View>
    </View>
  );
}

function QuickAction({ item }: { item: ProfileMenuItem }) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      accessibilityLabel={`${item.label}${item.badge ? `, ${item.badge.toLocaleLowerCase("tr-TR")}` : ""}`}
      accessibilityRole="button"
      onPress={item.onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.quickIcon, { backgroundColor: themeColors.background }]}
      >
        <SymbolView
          name={item.icon}
          size={20}
          tintColor={themeColors.primary}
        />
      </View>
      <AppText numberOfLines={2} style={styles.quickLabel} variant="label">
        {item.label}
      </AppText>
      <SymbolView
        name={{
          ios: "chevron.right",
          android: "chevron_right",
          web: "chevron_right",
        }}
        size={16}
        tintColor={themeColors.textMuted}
      />
    </Pressable>
  );
}
