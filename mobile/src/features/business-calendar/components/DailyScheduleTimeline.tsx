import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessAppointment } from '@/features/appointments/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { getBusinessMinuteOfDay, minutesToTime } from '../date';

const HOUR_HEIGHT = 76;

type PositionedAppointment = {
  appointment: BusinessAppointment;
  endMinute: number;
  lane: number;
  startMinute: number;
};

function positionAppointments(appointments: BusinessAppointment[], timeZone: string) {
  const lanes: number[] = [];
  const positioned: PositionedAppointment[] = [];

  const sorted = [...appointments].sort((first, second) =>
    first.startsAt.localeCompare(second.startsAt),
  );

  for (const appointment of sorted) {
    const startMinute = getBusinessMinuteOfDay(appointment.startsAt, timeZone);
    const endMinute = Math.max(
      startMinute + appointment.durationMinutes,
      getBusinessMinuteOfDay(appointment.endsAt, timeZone),
    );
    const availableLane = lanes.findIndex((laneEnd) => laneEnd <= startMinute);
    const lane = availableLane === -1 ? lanes.length : availableLane;
    lanes[lane] = endMinute;
    positioned.push({ appointment, endMinute, lane, startMinute });
  }

  return { laneCount: Math.max(lanes.length, 1), positioned };
}

export function DailyScheduleTimeline({
  appointments,
  endMinute,
  showBarber,
  startMinute,
  timeZone,
}: {
  appointments: BusinessAppointment[];
  endMinute: number;
  showBarber: boolean;
  startMinute: number;
  timeZone: string;
}) {
  const themeColors = useThemeColors();
  const totalMinutes = Math.max(endMinute - startMinute, 60);
  const timelineHeight = (totalMinutes / 60) * HOUR_HEIGHT;
  const hourMarks = Array.from(
    { length: Math.ceil(totalMinutes / 60) + 1 },
    (_, index) => startMinute + index * 60,
  ).filter((minute) => minute <= endMinute);
  const { laneCount, positioned } = positionAppointments(appointments, timeZone);
  const laneWidth = 100 / laneCount;

  return (
    <View style={[styles.timeline, { height: timelineHeight + 22 }]}>
      {hourMarks.map((minute, index) => (
        <View
          key={minute}
          style={[styles.hourRow, { top: index * HOUR_HEIGHT }]}>
          <AppText color="textMuted" style={styles.hourLabel} variant="bodySmall">
            {minutesToTime(minute)}
          </AppText>
          <View style={[styles.hourLine, { backgroundColor: themeColors.border }]} />
        </View>
      ))}

      <View style={styles.eventLayer}>
        {positioned.map(({ appointment, endMinute: appointmentEnd, lane, startMinute: appointmentStart }) => {
          const colorsForStatus = {
            accent: {
              CONFIRMED: themeColors.success,
              ARRIVED: themeColors.info,
              COMPLETED: themeColors.primary,
              CANCELLED: themeColors.danger,
              NO_SHOW: themeColors.primaryPressed,
            }[appointment.status],
            background: themeColors.surfaceMuted,
          };
          const top = ((appointmentStart - startMinute) / 60) * HOUR_HEIGHT;
          const naturalHeight = ((appointmentEnd - appointmentStart) / 60) * HOUR_HEIGHT;
          const customerName = `${appointment.customer.firstName} ${appointment.customer.lastName}`;
          const barberName = appointment.businessMember.user.firstName;

          return (
            <View
              key={appointment.id}
              style={[
                styles.appointment,
                {
                  backgroundColor: colorsForStatus.background,
                  borderLeftColor: colorsForStatus.accent,
                  height: Math.max(naturalHeight - 4, 38),
                  left: `${lane * laneWidth}%`,
                  top: top + 2,
                  width: `${laneWidth}%`,
                },
              ]}>
              <AppText numberOfLines={1} style={styles.customer} variant="label">
                {customerName}
              </AppText>
              <AppText color="textMuted" numberOfLines={1} style={styles.service} variant="bodySmall">
                {appointment.serviceNameSnapshot}
              </AppText>
              <AppText color="textMuted" numberOfLines={1} style={styles.meta} variant="bodySmall">
                {minutesToTime(appointmentStart)}–{minutesToTime(appointmentEnd)}
                {showBarber ? ` · ${barberName}` : ''}
              </AppText>
            </View>
          );
        })}
      </View>

      {!appointments.length ? (
        <View
          pointerEvents="none"
          style={[
            styles.empty,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          ]}>
          <AppText color="textMuted" style={styles.emptyText} variant="bodySmall">
            Bugün için randevu bulunmuyor.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: { marginTop: spacing.sm, position: 'relative' },
  hourRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 20,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  hourLabel: { fontSize: 10, lineHeight: 14, width: 46 },
  hourLine: { flex: 1, height: StyleSheet.hairlineWidth },
  eventLayer: { bottom: 0, left: 50, position: 'absolute', right: 0, top: 0 },
  appointment: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
    paddingHorizontal: spacing.xs,
    paddingVertical: 5,
    position: 'absolute',
    transform: [{ scaleX: 0.97 }],
  },
  customer: { fontSize: 11, lineHeight: 14 },
  service: { fontSize: 9, lineHeight: 12, marginTop: 1 },
  meta: { fontSize: 8, lineHeight: 11, marginTop: 1 },
  empty: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    left: 74,
    padding: spacing.md,
    position: 'absolute',
    right: spacing.sm,
    top: HOUR_HEIGHT * 1.4,
  },
  emptyText: { textAlign: 'center' },
});
