import { Image } from "expo-image";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/AppText";
import { AppIconButton } from "@/components/ui/AppIconButton";
import { BrandedPageHeader } from "@/components/ui/BrandedPageHeader";
import { Screen } from "@/components/ui/Screen";
import { getMyAppointments } from "@/features/appointments/api";
import { useAuth } from "@/features/auth/AuthProvider";
import { getFavoriteBarbershops } from "@/features/favorites/api";
import { getMyHaircutHistory } from "@/features/haircut-history/api";
import { useAppPreferences } from "@/features/preferences/AppPreferencesProvider";
import {
  ProfileMenuGroup,
  type ProfileMenuItem,
} from "@/features/profile/components/ProfileMenuGroup";
import { colors } from "@/theme/colors";
import { layout, radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type ProfileStats = { appointments: number; favorites: number; styles: number };

export default function ProfileOverviewScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { translate } = useAppPreferences();
  const { signOut, token, user } = useAuth();
  const [stats, setStats] = useState<ProfileStats>({
    appointments: 0,
    favorites: 0,
    styles: 0,
  });
  const [lastCompletedAppointmentId, setLastCompletedAppointmentId] = useState<
    string | null
  >(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let isActive = true;
      void Promise.all([
        getFavoriteBarbershops(token),
        getMyAppointments(token),
        getMyHaircutHistory(token),
      ])
        .then(([favorites, appointments, styles]) => {
          if (isActive) {
            const lastCompleted = appointments
              .filter((appointment) => appointment.status === "COMPLETED")
              .sort((first, second) =>
                second.startsAt.localeCompare(first.startsAt),
              )[0];
            setStats({
              appointments: appointments.length,
              favorites: favorites.length,
              styles: styles.length,
            });
            setLastCompletedAppointmentId(lastCompleted?.id ?? null);
          }
        })
        .catch(() => undefined);
      return () => {
        isActive = false;
      };
    }, [token]),
  );

  if (!user) return null;

  const settings: ProfileMenuItem[] = [
    {
      icon: {
        ios: "person.crop.circle",
        android: "manage_accounts",
        web: "manage_accounts",
      },
      id: "account",
      label: translate("Hesap Ayarları", "Account Settings"),
      onPress: () => router.push("/profile/settings"),
    },
    {
      icon: { ios: "lock.shield", android: "shield", web: "shield" },
      id: "privacy",
      label: translate("Gizlilik & Veriler", "Privacy & Data"),
      onPress: () => router.push("/data-export"),
    },
    {
      icon: { ios: "bell", android: "notifications", web: "notifications" },
      id: "notifications",
      label: translate("Bildirim Tercihleri", "Notification Preferences"),
      onPress: () => router.push("/profile/notifications"),
    },
    {
      icon: { ios: "gearshape", android: "settings", web: "settings" },
      id: "application",
      label: translate("Uygulama Ayarları", "App Settings"),
      onPress: () => router.push("/application-settings"),
    },
    {
      badge: "YAKINDA",
      icon: {
        ios: "questionmark.circle",
        android: "help_outline",
        web: "help_outline",
      },
      id: "support",
      label: translate("Yardım & Destek", "Help & Support"),
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
      onPress: () => void signOut(),
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
              icon={{
                ios: "person.2",
                android: "switch_account",
                web: "switch_account",
              }}
              onPress={() => router.push("/profiles")}
              size={20}
              color="onPrimary"
              variant="primary"
            />
          }
        />

        <ImageBackground
          imageStyle={styles.heroImage}
          resizeMode="cover"
          source={require("../../../../assets/images/profile-customer-hero.png")}
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
                  {user.firstName.slice(0, 1).toUpperCase()}
                </AppText>
              </View>
            )}
            <View style={styles.identity}>
              <AppText
                color="onPrimary"
                numberOfLines={2}
                style={styles.name}
                variant="displayMedium"
              >
                {user.firstName} {user.lastName}
              </AppText>
              <View style={styles.customerBadge}>
                <AppText color="primary" variant="label">
                  {translate("Müşteri", "Customer")}
                </AppText>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Profili düzenle"
              accessibilityRole="button"
              onPress={() => router.push("/profile/edit")}
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
            >
              <SymbolView
                name={{ ios: "pencil", android: "edit", web: "edit" }}
                size={15}
                tintColor={themeColors.primary}
              />
              <AppText color="primary" variant="label">
                {translate("Düzenle", "Edit")}
              </AppText>
            </Pressable>
          </View>
        </ImageBackground>

        <View style={styles.statsRow}>
          <StatCard
            icon={{
              ios: "heart",
              android: "favorite_border",
              web: "favorite_border",
            }}
            label={translate("Favori Berber", "Favorite Barber")}
            value={stats.favorites}
          />
          <StatCard
            icon={{
              ios: "calendar",
              android: "calendar_month",
              web: "calendar_month",
            }}
            label={translate("Randevu", "Appointment")}
            value={stats.appointments}
          />
          <StatCard
            icon={{
              ios: "scissors",
              android: "content_cut",
              web: "content_cut",
            }}
            label={translate("Stil", "Style")}
            value={stats.styles}
          />
        </View>

        <AppText style={styles.quickSectionTitle} variant="sectionTitle">
          {translate("Hızlı İşlemler", "Quick Actions")}
        </AppText>
        <View style={styles.quickGrid}>
          <QuickAction
            icon={{
              ios: "bell",
              android: "notifications",
              web: "notifications",
            }}
            label={translate("Bildirimler", "Notifications")}
            onPress={() => router.push("/notifications")}
          />
          <QuickAction
            icon={{ ios: "tag", android: "local_offer", web: "local_offer" }}
            label={translate("Kampanyalar", "Campaigns")}
            onPress={() => router.push("/campaigns")}
          />
          <QuickAction
            icon={{ ios: "photo", android: "image", web: "image" }}
            label={translate("Kaydettiğim Stiller", "Saved Styles")}
            onPress={() => router.push("/profile/history")}
          />
          <QuickAction
            icon={{
              ios: "person.badge.plus",
              android: "person_add",
              web: "person_add",
            }}
            label={translate("Davet Kodunu Kullan", "Use Invite Code")}
            onPress={() =>
              router.push({
                pathname: "/business-access",
                params: { returnTo: "profile" },
              })
            }
          />
        </View>

        <Pressable
          accessibilityLabel="Son tıraşımı görüntüle"
          accessibilityRole="button"
          onPress={() =>
            lastCompletedAppointmentId
              ? router.push({
                  pathname: "/appointments/[appointmentId]",
                  params: { appointmentId: lastCompletedAppointmentId },
                })
              : router.push("/(tabs)/appointments")
          }
          style={({ pressed }) => [
            styles.lastHaircut,
            pressed && styles.pressed,
          ]}
        >
          <ImageBackground
            imageStyle={styles.lastHaircutImage}
            resizeMode="cover"
            source={require("../../../../assets/images/profile-last-haircut.png")}
            style={styles.lastHaircutBackground}
          >
            <View style={styles.lastHaircutOverlay} />
            <View style={styles.lastHaircutCopy}>
              <SymbolView
                name={{
                  ios: "scissors",
                  android: "content_cut",
                  web: "content_cut",
                }}
                size={25}
                tintColor={colors.onPrimary}
              />
              <View>
                <AppText color="onPrimary" variant="heading">
                  {translate("Son Tıraşım", "My Last Haircut")}
                </AppText>
                <AppText color="onPrimary" variant="bodySmall">
                  {translate(
                    "Geçmiş stilini yeniden görüntüle",
                    "View your previous style again",
                  )}
                </AppText>
              </View>
            </View>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={22}
              style={styles.lastHaircutChevron}
              tintColor={colors.onPrimary}
            />
          </ImageBackground>
        </Pressable>

        <ProfileMenuGroup
          items={settings}
          title={translate("Ayarlar", "Settings")}
          titleStyle={styles.settingsSectionTitle}
          titleVariant="sectionTitle"
        />
      </ScrollView>
    </Screen>
  );
}

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
        <SymbolView name={icon} size={20} tintColor={themeColors.primary} />
      </View>
      <View style={styles.statCopy}>
        <AppText style={styles.statValue} variant="heading">
          {value}
        </AppText>
        <AppText
          color="textMuted"
          numberOfLines={2}
          style={styles.statLabel}
          variant="bodySmall"
        >
          {label}
        </AppText>
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
  soon = false,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  onPress?: () => void;
  soon?: boolean;
}) {
  const themeColors = useThemeColors();
  const { translate } = useAppPreferences();
  return (
    <Pressable
      accessibilityLabel={`${label}${soon ? ", yakında" : ""}`}
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickAction,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
        !onPress && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.quickIcon, { backgroundColor: themeColors.background }]}
      >
        <SymbolView name={icon} size={20} tintColor={themeColors.primary} />
      </View>
      <View style={styles.quickCopy}>
        <AppText
          numberOfLines={2}
          style={styles.quickLabel}
          variant="cardTitle"
        >
          {label}
        </AppText>
        {soon ? (
          <View
            style={[
              styles.soonBadge,
              {
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
              },
            ]}
          >
            <AppText color="primary" style={styles.soonLabel} variant="label">
              {translate("Yakında", "Soon")}
            </AppText>
          </View>
        ) : null}
      </View>
      {onPress ? (
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={16}
          tintColor={themeColors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 116,
    paddingHorizontal: layout.screenHorizontalPadding,
  },
  hero: { borderRadius: radius.lg, minHeight: 136, overflow: "hidden" },
  heroImage: { borderRadius: radius.lg },
  heroOverlay: {
    backgroundColor: "rgba(18, 12, 8, 0.42)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  heroMain: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 136,
    padding: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 64, width: 64 },
  avatarPlaceholder: {
    alignItems: "center",
    backgroundColor: "rgba(247,243,234,0.94)",
    justifyContent: "center",
  },
  initial: { fontSize: 30, lineHeight: 36 },
  identity: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  name: { fontSize: 24, lineHeight: 29 },
  customerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(247,232,187,0.9)",
    borderRadius: radius.pill,
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  editButton: {
    alignItems: "center",
    backgroundColor: "rgba(255,252,247,0.94)",
    borderColor: colors.primary,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  statCard: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flex: 1,
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
  statValue: { fontSize: 18, lineHeight: 21, marginTop: 1 },
  statLabel: { lineHeight: 16, textAlign: "center" },
  quickSectionTitle: { fontSize: 22, lineHeight: 28, marginTop: spacing.xl },
  settingsSectionTitle: { fontSize: 22, lineHeight: 28 },
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
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  quickCopy: { flex: 1, marginLeft: spacing.xs, minWidth: 0 },
  quickLabel: { fontSize: 12, lineHeight: 16 },
  soonBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  soonLabel: { fontSize: 9, lineHeight: 12 },
  lastHaircut: {
    borderRadius: radius.md,
    marginTop: spacing.sm,
    overflow: "hidden",
  },
  lastHaircutBackground: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 80,
    paddingHorizontal: spacing.md,
  },
  lastHaircutImage: { borderRadius: radius.md },
  lastHaircutOverlay: {
    backgroundColor: "rgba(12, 8, 5, 0.48)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  lastHaircutCopy: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  lastHaircutChevron: { marginRight: spacing.xxs },
  disabled: { opacity: 1 },
  pressed: { opacity: 0.72 },
});
