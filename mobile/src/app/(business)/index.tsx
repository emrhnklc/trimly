import { useCallback, useMemo, useRef, useState } from "react";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { AppText } from "@/components/ui/AppText";
import { AppIconButton } from "@/components/ui/AppIconButton";
import { Screen } from "@/components/ui/Screen";
import {
  cancelBusinessAppointment,
  getBusinessAppointments,
  getMyBusinessAppointments,
  markBusinessAppointmentArrived,
  undoBusinessAppointmentArrival,
} from "@/features/appointments/api";
import type { BusinessAppointment } from "@/features/appointments/types";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  AppointmentPeriodTabs,
  type AppointmentPeriod,
} from "@/features/business-appointments/components/AppointmentPeriodTabs";
import { BusinessAppointmentCard } from "@/features/business-appointments/components/BusinessAppointmentCard";
import { BusinessActiveAppointmentCard } from "@/features/business-appointments/components/BusinessActiveAppointmentCard";
import { BusinessAppointmentState } from "@/features/business-appointments/components/BusinessAppointmentState";
import { BusinessAppointmentCancellationSheet } from "@/features/business-appointments/components/BusinessAppointmentCancellationSheet";
import {
  formatBusinessDate,
  formatBusinessTime,
  getDateKey,
} from "@/features/business-appointments/date";
import { useBusiness } from "@/features/business/BusinessProvider";
import { BusinessScreenHeader } from "@/features/business/components/BusinessScreenHeader";
import { useAppPreferences } from "@/features/preferences/AppPreferencesProvider";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export default function BusinessAppointmentsRoute() {
  const { can } = useBusiness();

  if (!can("VIEW_OWN_APPOINTMENTS")) {
    return <Redirect href="/(business)/calendar" />;
  }

  return <BusinessAppointmentsScreen />;
}

function BusinessAppointmentsScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { language, translate } = useAppPreferences();
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [period, setPeriod] = useState<AppointmentPeriod>("today");
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<
    string | null
  >(null);
  const [referenceTime, setReferenceTime] = useState(() => Date.now());
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [actionAppointmentId, setActionAppointmentId] = useState<string | null>(
    null,
  );
  const [cancellationAppointment, setCancellationAppointment] =
    useState<BusinessAppointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loadedBusinessId = useRef<string | null>(null);

  const loadAppointments = useCallback(
    async (refreshing = false, silent = false) => {
      if (!token || !activeMembership) return;

      if (refreshing) setRefreshing(true);
      else if (
        !silent &&
        loadedBusinessId.current !== activeMembership.barbershop.id
      ) {
        setLoading(true);
      }
      setError(null);

      try {
        const getAppointments = can("VIEW_ALL_APPOINTMENTS")
          ? getBusinessAppointments
          : getMyBusinessAppointments;
        const nextAppointments = await getAppointments(
          activeMembership.barbershop.id,
          token,
        );
        setAppointments(nextAppointments);
        setReferenceTime(Date.now());
        loadedBusinessId.current = activeMembership.barbershop.id;
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : "Randevular yüklenemedi.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, can, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();

      const refreshTimer = setInterval(() => {
        void loadAppointments(false, true);
      }, 30_000);

      return () => clearInterval(refreshTimer);
    }, [loadAppointments]),
  );

  const groupedAppointments = useMemo(() => {
    if (!activeMembership) return { history: [], today: [], upcoming: [] };

    const timeZone = activeMembership.barbershop.timezone;
    const todayKey = getDateKey(new Date(referenceTime), timeZone);
    const today = appointments
      .filter(
        (appointment) =>
          getDateKey(new Date(appointment.startsAt), timeZone) === todayKey,
      )
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
    const todayIds = new Set(today.map((appointment) => appointment.id));
    const upcoming = appointments
      .filter(
        (appointment) =>
          !todayIds.has(appointment.id) &&
          appointment.status === "CONFIRMED" &&
          new Date(appointment.startsAt).getTime() > referenceTime,
      )
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
    const upcomingIds = new Set(upcoming.map((appointment) => appointment.id));
    const history = appointments
      .filter(
        (appointment) =>
          !todayIds.has(appointment.id) && !upcomingIds.has(appointment.id),
      )
      .sort((first, second) => second.startsAt.localeCompare(first.startsAt));

    return { history, today, upcoming };
  }, [activeMembership, appointments, referenceTime]);

  const activeAppointment = useMemo(() => {
    const arrived = groupedAppointments.today.find(
      (appointment) => appointment.status === "ARRIVED",
    );
    if (arrived) return arrived;

    const currentOrNext = groupedAppointments.today.find(
      (appointment) =>
        appointment.status === "CONFIRMED" &&
        new Date(appointment.endsAt).getTime() >= referenceTime,
    );
    if (currentOrNext) return currentOrNext;

    return [...groupedAppointments.today]
      .reverse()
      .find((appointment) => appointment.status === "CONFIRMED");
  }, [groupedAppointments.today, referenceTime]);

  const summary = useMemo(() => {
    const nextAppointment = appointments
      .filter(
        (appointment) =>
          (appointment.status === "CONFIRMED" ||
            appointment.status === "ARRIVED") &&
          new Date(appointment.endsAt).getTime() >= referenceTime,
      )
      .sort((first, second) =>
        first.startsAt.localeCompare(second.startsAt),
      )[0];

    return {
      completed: groupedAppointments.today.filter(
        (appointment) => appointment.status === "COMPLETED",
      ).length,
      nextAppointment,
      today: groupedAppointments.today.filter(
        (appointment) => appointment.status !== "CANCELLED",
      ).length,
    };
  }, [appointments, groupedAppointments.today, referenceTime]);

  const pendingHaircutRecords = useMemo(
    () =>
      appointments.filter(
        (appointment) =>
          appointment.status === "COMPLETED" &&
          !appointment.haircutRecord?.finalizedAt,
      ),
    [appointments],
  );

  const historyMonths = useMemo(
    () =>
      Array.from(
        new Set(
          groupedAppointments.history.map((appointment) =>
            getDateKey(
              new Date(appointment.startsAt),
              activeMembership?.barbershop.timezone ?? "Europe/Istanbul",
            ).slice(0, 7),
          ),
        ),
      ),
    [activeMembership?.barbershop.timezone, groupedAppointments.history],
  );

  if (!activeMembership) return null;

  const currentHistoryMonth = getDateKey(
    new Date(referenceTime),
    activeMembership.barbershop.timezone,
  ).slice(0, 7);
  const activeHistoryMonth =
    selectedHistoryMonth ?? historyMonths[0] ?? currentHistoryMonth;
  const selectedAppointments =
    period === "history" && activeHistoryMonth
      ? groupedAppointments.history.filter((appointment) =>
          getDateKey(
            new Date(appointment.startsAt),
            activeMembership.barbershop.timezone,
          ).startsWith(activeHistoryMonth),
        )
      : groupedAppointments[period];
  const listedAppointments =
    period === "today" && activeAppointment
      ? selectedAppointments.filter(
          (appointment) => appointment.id !== activeAppointment.id,
        )
      : selectedAppointments;
  const timeZone = activeMembership.barbershop.timezone;
  const emptyMessages: Record<
    AppointmentPeriod,
    { description: string; title: string }
  > = {
    today: {
      description: translate(
        "Bugün için planlanmış bir randevu bulunmuyor.",
        "There are no appointments scheduled for today.",
      ),
      title: translate("Bugün takvim sakin", "Your calendar is clear today"),
    },
    upcoming: {
      description: translate(
        "Bugünden sonraki randevular burada görünecek.",
        "Future appointments will appear here.",
      ),
      title: translate("Gelecek randevu yok", "No future appointments"),
    },
    history: {
      description: translate(
        "Tamamlanan, iptal edilen ve geçmiş randevular burada birikecek.",
        "Completed, cancelled and past appointments will appear here.",
      ),
      title: translate("Geçmiş henüz boş", "No appointment history yet"),
    },
  };

  async function runAppointmentAction(
    appointment: BusinessAppointment,
    action: "arrive" | "undo-arrival" | "cancel",
    cancellationReason?: string,
  ) {
    if (!token || !activeMembership) return;

    setActionAppointmentId(appointment.id);
    try {
      if (action === "arrive") {
        await markBusinessAppointmentArrived(
          activeMembership.barbershop.id,
          appointment.id,
          token,
        );
      } else if (action === "undo-arrival") {
        await undoBusinessAppointmentArrival(
          activeMembership.barbershop.id,
          appointment.id,
          token,
        );
      } else {
        await cancelBusinessAppointment(
          activeMembership.barbershop.id,
          appointment.id,
          token,
          cancellationReason ?? "",
        );
      }
      if (action === "cancel") setCancellationAppointment(null);
      await loadAppointments(false, true);
    } catch (reason) {
      Alert.alert(
        "Randevu güncellenemedi",
        reason instanceof Error ? reason.message : "Lütfen tekrar dene.",
      );
    } finally {
      setActionAppointmentId(null);
    }
  }

  function confirmCancellation(appointment: BusinessAppointment) {
    setCancellationAppointment(appointment);
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadAppointments(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <BusinessScreenHeader
          onNotificationPress={() =>
            router.push({
              pathname: "/notifications",
              params: { returnTo: "business-home" },
            })
          }
          showNotification
          subtitle={activeMembership.barbershop.name}
          title={translate("Randevular", "Appointments")}
        />
        {!isLoading && !error && pendingHaircutRecords.length ? (
          <Pressable
            accessibilityLabel={`${pendingHaircutRecords.length} tıraş kaydını tamamla`}
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/business-haircut-record/[appointmentId]",
                params: { appointmentId: pendingHaircutRecords[0].id },
              })
            }
            style={({ pressed }) => [
              styles.pendingRecordCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.primary,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.pendingRecordIcon,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <SymbolView
                name={{
                  ios: "text.badge.plus",
                  android: "note_add",
                  web: "note_add",
                }}
                size={22}
                tintColor={themeColors.primary}
              />
            </View>
            <View style={styles.pendingRecordCopy}>
              <AppText variant="label">
                {pendingHaircutRecords.length} tıraş kaydı bekliyor
              </AppText>
              <AppText color="textMuted" variant="bodySmall">
                Tamamlanan randevunun notunu şimdi ekleyebilirsin.
              </AppText>
            </View>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={17}
              tintColor={themeColors.primary}
            />
          </Pressable>
        ) : null}
        <View style={styles.summaryRow}>
          <SummaryCard
            icon={{
              ios: "calendar",
              android: "calendar_month",
              web: "calendar_month",
            }}
            label={translate("Bugün", "Today")}
            value={String(summary.today)}
          />
          <SummaryCard
            icon={{ ios: "clock", android: "schedule", web: "schedule" }}
            label={translate("Sıradaki", "Next")}
            value={
              summary.nextAppointment
                ? formatBusinessTime(summary.nextAppointment.startsAt, timeZone)
                : "—"
            }
          />
          <SummaryCard
            icon={{
              ios: "checkmark.circle",
              android: "task_alt",
              web: "task_alt",
            }}
            label={translate("Bitti", "Done")}
            value={String(summary.completed)}
          />
        </View>
        <AppointmentPeriodTabs onChange={setPeriod} value={period} />

        {period === "history" && activeHistoryMonth ? (
          <View
            style={[
              styles.monthPicker,
              { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <AppIconButton
              accessibilityLabel="Önceki ay"
              icon={{
                ios: "chevron.left",
                android: "chevron_left",
                web: "chevron_left",
              }}
              onPress={() =>
                setSelectedHistoryMonth(shiftMonthKey(activeHistoryMonth, -1))
              }
              size={17}
              variant="transparent"
            />
            <AppText
              numberOfLines={1}
              style={styles.monthLabel}
              variant="label"
            >
              {formatMonthLabel(activeHistoryMonth, language)}
            </AppText>
            <AppIconButton
              accessibilityLabel="Sonraki ay"
              disabled={activeHistoryMonth >= currentHistoryMonth}
              icon={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              onPress={() =>
                setSelectedHistoryMonth(shiftMonthKey(activeHistoryMonth, 1))
              }
              size={17}
              variant="transparent"
            />
          </View>
        ) : null}

        {!isLoading && error ? (
          <BusinessAppointmentState
            description={error}
            error
            onRetry={() => void loadAppointments()}
            title={translate(
              "Randevular yüklenemedi",
              "Appointments could not be loaded",
            )}
          />
        ) : null}

        {!isLoading && !error && period === "today" && activeAppointment ? (
          <BusinessActiveAppointmentCard
            appointment={activeAppointment}
            isSubmitting={actionAppointmentId === activeAppointment.id}
            now={referenceTime}
            onArrive={() =>
              void runAppointmentAction(activeAppointment, "arrive")
            }
            onCancel={() => confirmCancellation(activeAppointment)}
            onDetail={() =>
              router.push({
                pathname: "/business-appointments/[appointmentId]",
                params: { appointmentId: activeAppointment.id },
              })
            }
            onUndoArrival={() =>
              void runAppointmentAction(activeAppointment, "undo-arrival")
            }
            timeZone={timeZone}
          />
        ) : null}

        {!isLoading && !error && !selectedAppointments.length ? (
          <BusinessAppointmentState {...emptyMessages[period]} />
        ) : null}

        {!isLoading && !error && listedAppointments.length ? (
          <View style={styles.groups}>
            {groupAppointmentsByDate(listedAppointments, timeZone).map(
              (group) => (
                <View key={group.dateKey} style={styles.group}>
                  <View style={styles.dateRow}>
                    <AppText style={styles.date} variant="cardTitle">
                      {formatBusinessDate(
                        new Date(group.appointments[0].startsAt),
                        timeZone,
                        language === "en" ? "en-US" : "tr-TR",
                      )}
                    </AppText>
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: themeColors.surfaceMuted },
                      ]}
                    >
                      <AppText
                        color="primary"
                        style={styles.count}
                        variant="label"
                      >
                        {group.appointments.length}
                      </AppText>
                    </View>
                  </View>
                  {group.appointments.map((appointment, index) => (
                    <BusinessAppointmentCard
                      appointment={appointment}
                      isLast={index === group.appointments.length - 1}
                      key={appointment.id}
                      onPress={() =>
                        router.push({
                          pathname: "/business-appointments/[appointmentId]",
                          params: { appointmentId: appointment.id },
                        })
                      }
                      timeZone={timeZone}
                    />
                  ))}
                </View>
              ),
            )}
          </View>
        ) : null}
      </ScrollView>
      {cancellationAppointment ? (
        <BusinessAppointmentCancellationSheet
          customerName={cancellationAppointment.attendeeNameSnapshot}
          isSubmitting={actionAppointmentId === cancellationAppointment.id}
          onClose={() => setCancellationAppointment(null)}
          onSubmit={(reason) =>
            void runAppointmentAction(
              cancellationAppointment,
              "cancel",
              reason,
            )
          }
          visible
        />
      ) : null}
    </Screen>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps["name"];
  label: string;
  value: string;
}) {
  const themeColors = useThemeColors();

  return (
    <View
      style={[
        styles.summaryCard,
        {
          backgroundColor: themeColors.surface,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View
        style={[
          styles.summaryIcon,
          { backgroundColor: themeColors.surfaceMuted },
        ]}
      >
        <SymbolView name={icon} size={20} tintColor={themeColors.primary} />
      </View>
      <View style={styles.summaryCopy}>
        <AppText
          color="textMuted"
          numberOfLines={1}
          style={styles.summaryLabel}
          variant="bodySmall"
        >
          {label}
        </AppText>
        <AppText
          numberOfLines={1}
          style={styles.summaryValue}
          variant="cardTitle"
        >
          {value}
        </AppText>
      </View>
    </View>
  );
}

function groupAppointmentsByDate(
  appointments: BusinessAppointment[],
  timeZone: string,
) {
  const groups = new Map<string, BusinessAppointment[]>();

  appointments.forEach((appointment) => {
    const dateKey = getDateKey(new Date(appointment.startsAt), timeZone);
    groups.set(dateKey, [...(groups.get(dateKey) ?? []), appointment]);
  });

  return Array.from(groups, ([dateKey, grouped]) => ({
    appointments: grouped.sort((first, second) =>
      first.startsAt.localeCompare(second.startsAt),
    ),
    dateKey,
  }));
}

function formatMonthLabel(monthKey: string, language: "en" | "tr") {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function shiftMonthKey(monthKey: string, amount: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(year, month - 1 + amount, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  summaryRow: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.md },
  pendingRecordCard: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  pendingRecordIcon: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  pendingRecordCopy: { flex: 1, gap: 2 },
  summaryCard: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    minHeight: 72,
    padding: spacing.xs,
  },
  summaryIcon: {
    alignItems: "center",
    borderRadius: 999,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  summaryCopy: { flex: 1, marginLeft: 7, minWidth: 0 },
  summaryLabel: { fontSize: 10, lineHeight: 14 },
  summaryValue: { fontSize: 16, lineHeight: 21, marginTop: 1 },
  groups: { marginTop: spacing.sm },
  group: { marginTop: spacing.md },
  dateRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  date: { flex: 1, textTransform: "capitalize" },
  monthPicker: {
    alignItems: "center",
    alignSelf: "center",
    borderRadius: 999,
    flexDirection: "row",
    height: 38,
    marginTop: spacing.md,
    paddingHorizontal: 2,
  },
  monthLabel: { fontSize: 11, minWidth: 106, textAlign: "center" },
  countBadge: {
    alignItems: "center",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    minWidth: 24,
    paddingHorizontal: 7,
  },
  count: { fontSize: 11, lineHeight: 15 },
  loader: { marginTop: spacing.xxxl },
  pressed: { opacity: 0.72 },
});
