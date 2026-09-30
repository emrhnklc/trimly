import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import type { BusinessAppointment } from "@/features/appointments/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { formatBusinessTime } from "../date";

export function BusinessAppointmentCard({
  appointment,
  isLast = false,
  onPress,
  timeZone,
}: {
  appointment: BusinessAppointment;
  isLast?: boolean;
  onPress?: () => void;
  timeZone: string;
}) {
  const themeColors = useThemeColors();
  const customerName = appointment.attendeeNameSnapshot;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const nameParts = customerName.trim().split(/\s+/);
  const initials = `${nameParts[0]?.[0] ?? ""}${nameParts.at(-1)?.[0] ?? ""}`;
  const isHaircutRecordPending =
    appointment.status === "COMPLETED" &&
    !appointment.haircutRecord?.finalizedAt;
  const status: {
    backgroundColor: string;
    color: string;
    label: string;
  } | null = {
    CONFIRMED: null,
    ARRIVED: {
      backgroundColor: themeColors.infoSurface,
      color: themeColors.info,
      label: "Geldi",
    },
    COMPLETED: {
      backgroundColor: themeColors.surfaceMuted,
      color: themeColors.textMuted,
      label: "Tamamlandı",
    },
    CANCELLED: {
      backgroundColor: themeColors.dangerSurface,
      color: themeColors.danger,
      label: "İptal",
    },
    NO_SHOW: {
      backgroundColor: themeColors.surfaceMuted,
      color: themeColors.textMuted,
      label: "Gelmedi",
    },
  }[appointment.status];

  const content = (
    <View style={styles.timelineRow}>
      <View style={styles.timeColumn}>
        <AppText style={styles.time} variant="label">
          {formatBusinessTime(appointment.startsAt, timeZone)}
        </AppText>
        <AppText color="textMuted" style={styles.duration} variant="bodySmall">
          {appointment.durationMinutes} dk
        </AppText>
      </View>

      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: themeColors.primary }]} />
        {!isLast ? (
          <View
            style={[styles.line, { backgroundColor: themeColors.border }]}
          />
        ) : null}
      </View>

      <AppCard style={styles.card}>
        {!appointment.dependentProfileId && appointment.customer.profileImageUrl ? (
          <Image
            accessibilityLabel={`${customerName} profil fotoğrafı`}
            contentFit="cover"
            source={appointment.customer.profileImageUrl}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: themeColors.surfaceMuted },
            ]}
          >
            <AppText color="primary" variant="label">
              {initials}
            </AppText>
          </View>
        )}

        <View style={styles.details}>
          <AppText
            numberOfLines={1}
            style={styles.customerName}
            variant="label"
          >
            {customerName}
          </AppText>
          <AppText
            color="textMuted"
            numberOfLines={1}
            style={styles.service}
            variant="bodySmall"
          >
            {appointment.serviceNameSnapshot}
          </AppText>
          <AppText
            color="textMuted"
            numberOfLines={1}
            style={styles.barber}
            variant="bodySmall"
          >
            Berber: {barberName}
          </AppText>
          {isHaircutRecordPending ? (
            <AppText color="primary" style={styles.recordPending} variant="bodySmall">
              Tıraş kaydı bekliyor
            </AppText>
          ) : null}
        </View>

        {status ? (
          <View
            style={[styles.status, { backgroundColor: status.backgroundColor }]}
          >
            <AppText
              style={[styles.statusLabel, { color: status.color }]}
              variant="bodySmall"
            >
              {status.label}
            </AppText>
          </View>
        ) : null}

        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={17}
          tintColor={themeColors.textMuted}
        />
      </AppCard>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityLabel={`${customerName} randevu detayını aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  timelineRow: { alignItems: "stretch", flexDirection: "row", minHeight: 104 },
  card: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    marginBottom: spacing.sm,
    minHeight: 92,
    padding: spacing.sm,
  },
  timeColumn: { alignItems: "flex-start", paddingTop: spacing.md, width: 50 },
  time: { fontSize: 12, lineHeight: 16 },
  duration: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  rail: { alignItems: "center", marginRight: spacing.sm, width: 12 },
  dot: {
    borderRadius: radius.pill,
    height: 9,
    marginTop: 20,
    width: 9,
    zIndex: 1,
  },
  line: { bottom: 0, position: "absolute", top: 24, width: 1 },
  avatar: { borderRadius: radius.pill, height: 44, width: 44 },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  details: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  customerName: { fontSize: 14, lineHeight: 19 },
  service: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  barber: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  recordPending: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  status: {
    alignItems: "center",
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  statusLabel: { fontSize: 9, lineHeight: 12 },
  pressed: { opacity: 0.68 },
});
