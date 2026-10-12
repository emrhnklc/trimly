import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PublicBarbershopDetail } from "../types";
import { useThemeColors } from "@/theme/useThemeColors";
import { spacing, radius } from "@/theme/spacing";

const weekdays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
const labels = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
];
export function PublicWorkingHours({
  business,
}: {
  business: PublicBarbershopDetail;
}) {
  const colors = useThemeColors();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const weekdayLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: business.timezone,
    weekday: "long",
  })
    .format(now)
    .toUpperCase();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: business.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return (
    <AppCard style={styles.card}>
      {weekdays.map((day, index) => {
        const hours = business.workingHours?.find(
          (value) => value.weekday === day,
        );
        const today = day === weekdayLabel;
        const open = Boolean(
          hours && time >= hours.startTime && time < hours.endTime,
        );
        return (
          <View
            key={day}
            style={[
              styles.row,
              { borderBottomColor: colors.border },
              today && { backgroundColor: colors.surfaceMuted },
            ]}
          >
            <AppText
              color={today ? "primary" : "textMuted"}
              variant="bodySmall"
              style={styles.day}
            >
              {today ? "Bugün · " : ""}
              {labels[index]}
            </AppText>
            {today ? (
              <AppText
                color={open ? "success" : "textMuted"}
                variant="bodySmall"
              >
                {open ? "● Açık" : "Kapalı"}
              </AppText>
            ) : null}
            <AppText
              color={today ? "primary" : "textMuted"}
              variant="bodySmall"
            >
              {hours ? `${hours.startTime} – ${hours.endTime}` : "Kapalı"}
            </AppText>
          </View>
        );
      })}
    </AppCard>
  );
}
const styles = StyleSheet.create({
  card: { padding: spacing.xs },
  row: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  day: { flex: 1 },
});
