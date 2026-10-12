import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";

import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { SettingsPageHeader } from "@/components/ui/SettingsPageHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import { getMyHaircutHistory } from "@/features/haircut-history/api";
import type { CustomerHaircutRecord } from "@/features/haircut-history/types";
import { getFavoriteStyles } from "@/features/favorites/api";
import type { FavoriteStyle } from "@/features/favorites/types";
import {
  ProfileSavedStyles,
  type StyleTab,
} from "@/features/profile/components/ProfileSavedStyles";
import {
  AppointmentAttendeeFilterSheet,
  type AppointmentAttendeeFilter,
} from "@/features/appointments/components/AppointmentAttendeeFilterSheet";
import { getMyDependents } from "@/features/dependents/api";
import type { DependentProfile } from "@/features/dependents/types";
import { goBackOrReplace } from "@/lib/navigation/goBackOrReplace";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export default function ProfileHistoryScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const themeColors = useThemeColors();
  const { token, user } = useAuth();
  // Keep the selected tab when the list remounts during a focus refresh.
  const [activeTab, setActiveTab] = useState<StyleTab>("favorites");
  const [dependents, setDependents] = useState<DependentProfile[]>([]);
  const [attendeeFilter, setAttendeeFilter] =
    useState<AppointmentAttendeeFilter>("SELF");
  const [isFilterOpen, setFilterOpen] = useState(false);
  const [records, setRecords] = useState<CustomerHaircutRecord[]>([]);
  const [favoriteStyles, setFavoriteStyles] = useState<FavoriteStyle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (refreshing = false) => {
      if (!token) return;

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const [nextRecords, nextFavoriteStyles, nextDependents] =
          await Promise.all([
            getMyHaircutHistory(token),
            getFavoriteStyles(token),
            getMyDependents(token),
          ]);
        setRecords(nextRecords);
        setFavoriteStyles(nextFavoriteStyles);
        setDependents(nextDependents);
      } catch (reason: unknown) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Tıraş geçmişi yüklenemedi.",
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  if (!token) return null;

  function goBack() {
    goBackOrReplace(
      router,
      returnTo === "customer-home" ? "/(tabs)" : "/(tabs)/profile",
    );
  }

  const additionalAttendees = Array.from(
    new Map(
      records
        .filter(
          (record) =>
            record.appointment.dependentProfileId &&
            !dependents.some(
              (dependent) =>
                dependent.id === record.appointment.dependentProfileId,
            ),
        )
        .map((record) => {
          const { dependentProfileId, dependentProfile, attendeeNameSnapshot } =
            record.appointment;
          return [
            dependentProfileId!,
            {
              id: dependentProfileId!,
              name: dependentProfile
                ? `${dependentProfile.firstName} ${dependentProfile.lastName}`
                : attendeeNameSnapshot,
            },
          ] as const;
        }),
    ).values(),
  );
  const selectedDependentId = attendeeFilter.startsWith("DEPENDENT:")
    ? attendeeFilter.slice(10)
    : null;
  const selectedDependent = dependents.find(
    (dependent) => dependent.id === selectedDependentId,
  );
  const selectedLabel =
    attendeeFilter === "ALL"
      ? "Tümü"
      : attendeeFilter === "SELF"
        ? "Ben"
        : selectedDependent
          ? `${selectedDependent.firstName} ${selectedDependent.lastName}`
          : (additionalAttendees.find(
              (attendee) => attendee.id === selectedDependentId,
            )?.name ?? "Yakınım");
  const visibleRecords = records.filter(
    (record) =>
      attendeeFilter === "ALL" ||
      (attendeeFilter === "SELF"
        ? !record.appointment.dependentProfileId
        : record.appointment.dependentProfileId === selectedDependentId),
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[themeColors.primary]}
            onRefresh={() => void loadHistory(true)}
            refreshing={isRefreshing}
            tintColor={themeColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <SettingsPageHeader onBackPress={goBack} title="Kaydettiğim Stiller" />

        {isLoading ? (
          <ActivityIndicator
            color={themeColors.primary}
            style={styles.loader}
          />
        ) : null}
        {!isLoading && error ? (
          <AppText color="danger" style={styles.error} variant="bodySmall">
            {error}
          </AppText>
        ) : null}
        {!isLoading && !error ? (
          <>
            <ProfileSavedStyles
              accessToken={token}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              favoriteStyles={favoriteStyles}
              historyOwnerLabel={selectedLabel}
              onOpenAppointment={(id) => router.push(`/appointments/${id}`)}
              records={visibleRecords}
              historyHeader={
                <View style={styles.filterRow}>
                  <AppText
                    color="textMuted"
                    style={styles.filterCopy}
                    variant="bodySmall"
                  >
                    Kimin geçmişi?
                  </AppText>
                  <Pressable
                    accessibilityLabel={`Tıraş geçmişi sahibi: ${selectedLabel}. Kişi seç`}
                    accessibilityRole="button"
                    onPress={() => setFilterOpen(true)}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor: themeColors.surfaceMuted,
                        borderColor: themeColors.border,
                      },
                    ]}
                  >
                    <SymbolView
                      name={{ ios: "person", android: "person", web: "person" }}
                      size={17}
                      tintColor={themeColors.primary}
                    />
                    <AppText
                      numberOfLines={1}
                      style={styles.filterLabel}
                      variant="label"
                    >
                      {selectedLabel}
                    </AppText>
                    <SymbolView
                      name={{
                        ios: "chevron.down",
                        android: "expand_more",
                        web: "expand_more",
                      }}
                      size={13}
                      tintColor={themeColors.textMuted}
                    />
                  </Pressable>
                </View>
              }
            />
          </>
        ) : null}
      </ScrollView>
      <AppointmentAttendeeFilterSheet
        additionalAttendees={additionalAttendees}
        allDescription="Senin ve yakınlarının bütün tıraş kayıtları"
        dependents={dependents}
        onClose={() => setFilterOpen(false)}
        onSelect={setAttendeeFilter}
        selected={attendeeFilter}
        title="Tıraş geçmişi sahibi"
        user={user}
        visible={isFilterOpen}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  error: { marginTop: spacing.xl, textAlign: "center" },
  filterRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterCopy: { flex: 1 },
  filterButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    maxWidth: "65%",
    minHeight: 42,
    paddingHorizontal: spacing.sm,
  },
  filterLabel: { flexShrink: 1 },
});
