import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import type { BusinessAppointment } from "@/features/appointments/types";
import type { ThemeColors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { formatBusinessTime } from "../date";

const ARRIVAL_EARLY_WINDOW_MINUTES = 15;

function getMinutesUntilArrivalOpens(
  appointment: BusinessAppointment,
  now: number,
) {
  const opensAt =
    new Date(appointment.startsAt).getTime() -
    ARRIVAL_EARLY_WINDOW_MINUTES * 60 * 1000;
  return Math.max(0, Math.ceil((opensAt - now) / 60000));
}

function getCardState(
  appointment: BusinessAppointment,
  now: number,
  themeColors: ThemeColors,
) {
  const startsAt = new Date(appointment.startsAt).getTime();
  const endsAt = new Date(appointment.endsAt).getTime();

  if (appointment.status === "ARRIVED") {
    return {
      accent: themeColors.info,
      label: "MÜŞTERİ GELDİ",
    };
  }

  if (now > endsAt) {
    return {
      accent: "#9B6B3D",
      label: "GECİKEN RANDEVU",
    };
  }

  if (now >= startsAt) {
    return {
      accent: "#5E8B61",
      label: "SIRADAKİ RANDEVU",
    };
  }

  return {
    accent: themeColors.primary,
    label: "SIRADAKİ RANDEVU",
  };
}

export function BusinessActiveAppointmentCard({
  appointment,
  isSubmitting,
  now,
  onArrive,
  onCancel,
  onDetail,
  onUndoArrival,
  timeZone,
}: {
  appointment: BusinessAppointment;
  isSubmitting: boolean;
  now: number;
  onArrive: () => void;
  onCancel: () => void;
  onDetail: () => void;
  onUndoArrival: () => void;
  timeZone: string;
}) {
  const themeColors = useThemeColors();
  const customerName = appointment.attendeeNameSnapshot;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const nameParts = customerName.trim().split(/\s+/);
  const initials = `${nameParts[0]?.[0] ?? ""}${nameParts.at(-1)?.[0] ?? ""}`;
  const state = getCardState(appointment, now, themeColors);
  const minutesUntilArrivalOpens = getMinutesUntilArrivalOpens(
    appointment,
    now,
  );
  const canMarkArrived = minutesUntilArrivalOpens === 0;
  const hasArrived = appointment.status === "ARRIVED";
  const startsAt = new Date(appointment.startsAt).getTime();
  const minutesUntilStart = Math.max(0, Math.ceil((startsAt - now) / 60000));
  const hasEnded = new Date(appointment.endsAt).getTime() < now;
  const infoMessage = hasArrived
    ? appointment.autoCompleteAt
      ? `${formatBusinessTime(appointment.autoCompleteAt, timeZone)} civarı otomatik tamamlanacak.`
      : "Müşterinin geliş kaydı oluşturuldu."
    : !canMarkArrived
      ? `“Müşteri Geldi” ${minutesUntilArrivalOpens} dk sonra açılacak.`
      : hasEnded
        ? "Randevu saati geçti. Müşteri geldiyse geliş kaydını oluştur."
        : minutesUntilStart > 0
          ? `Randevuya ${minutesUntilStart} dk kaldı. Müşteri geldiyse geliş kaydını oluşturabilirsin.`
          : "Randevu saati geldi. Müşterinin geliş kaydını oluşturabilirsin.";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.surface, borderColor: state.accent },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: state.accent }]} />
          <AppText
            style={[styles.overline, { color: state.accent }]}
            variant="overline"
          >
            {state.label}
          </AppText>
        </View>
        <View
          style={[
            styles.timeBadge,
            { backgroundColor: themeColors.surfaceMuted },
          ]}
        >
          <SymbolView
            name={{ ios: "clock", android: "schedule", web: "schedule" }}
            size={15}
            tintColor={themeColors.primary}
          />
          <AppText color="primary" style={styles.time} variant="label">
            {formatBusinessTime(appointment.startsAt, timeZone)} –{" "}
            {formatBusinessTime(appointment.endsAt, timeZone)}
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityLabel={`${customerName} randevu detayını aç`}
        accessibilityRole="button"
        onPress={onDetail}
        style={({ pressed }) => [styles.customerRow, pressed && styles.pressed]}
      >
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
            <AppText color="primary" style={styles.initials} variant="heading">
              {initials}
            </AppText>
          </View>
        )}
        <View style={styles.customerCopy}>
          <AppText
            numberOfLines={1}
            style={styles.customerName}
            variant="heading"
          >
            {customerName}
          </AppText>
          <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
            {appointment.serviceNameSnapshot} · {appointment.durationMinutes} dk
          </AppText>
          <AppText
            color="textMuted"
            numberOfLines={1}
            style={styles.barber}
            variant="bodySmall"
          >
            {barberName} ile
          </AppText>
        </View>
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={17}
          tintColor={themeColors.textMuted}
        />
      </Pressable>

      <View
        style={[styles.infoRow, { backgroundColor: themeColors.background }]}
      >
        <SymbolView
          name={{ ios: "info.circle", android: "info", web: "info" }}
          size={19}
          tintColor={state.accent}
        />
        <AppText color="textMuted" style={styles.infoText} variant="bodySmall">
          {infoMessage}
        </AppText>
      </View>

      <View style={styles.actions}>
        <View style={styles.primaryAction}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || (!hasArrived && !canMarkArrived)}
            onPress={hasArrived ? onUndoArrival : onArrive}
            style={({ pressed }) => [
              styles.arrivalButton,
              {
                backgroundColor: hasArrived
                  ? themeColors.surfaceMuted
                  : themeColors.primary,
              },
              pressed && styles.pressed,
              (isSubmitting || (!hasArrived && !canMarkArrived)) &&
                styles.disabled,
            ]}
          >
            <AppText
              style={[
                styles.arrivalButtonLabel,
                { color: themeColors.darkSurface },
              ]}
              variant="label"
            >
              {isSubmitting
                ? "Güncelleniyor..."
                : hasArrived
                  ? "Gelişi Geri Al"
                  : "Müşteri Geldi"}
            </AppText>
          </Pressable>
        </View>
        <View style={styles.cancelAction}>
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
              isSubmitting && styles.disabled,
            ]}
          >
            <AppText style={styles.cancelLabel} variant="label">
              İptal Et
            </AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginTop: spacing.md,
    overflow: "hidden",
    padding: spacing.sm,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusRow: { alignItems: "center", flexDirection: "row" },
  statusDot: { borderRadius: radius.pill, height: 7, marginRight: 6, width: 7 },
  overline: { fontSize: 9, lineHeight: 13 },
  timeBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  time: { fontSize: 11, lineHeight: 15, marginLeft: 5 },
  customerRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 54, width: 54 },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 20, lineHeight: 26 },
  customerCopy: { flex: 1, marginLeft: spacing.md },
  customerName: { fontSize: 18, lineHeight: 24 },
  barber: { marginTop: 2 },
  infoRow: {
    alignItems: "center",
    borderRadius: radius.md,
    flexDirection: "row",
    marginTop: spacing.sm,
    minHeight: 42,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  infoText: { flex: 1, marginLeft: spacing.sm },
  actions: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.xs,
  },
  primaryAction: { flex: 1 },
  arrivalButton: {
    alignItems: "center",
    borderRadius: radius.card,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
  arrivalButtonLabel: { fontSize: 15, lineHeight: 20, textAlign: "center" },
  cancelAction: { marginLeft: spacing.xs, minWidth: 82 },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: spacing.xs,
  },
  cancelLabel: { textAlign: "center" },
  pressed: { opacity: 0.68 },
  disabled: { opacity: 0.45 },
});
