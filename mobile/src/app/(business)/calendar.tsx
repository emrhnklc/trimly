import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import {
  getBusinessAppointments,
  getMyBusinessAppointments,
} from '@/features/appointments/api';
import type { BusinessAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessAppointmentState } from '@/features/business-appointments/components/BusinessAppointmentState';
import { getDateKey } from '@/features/business-appointments/date';
import { BusinessMemberFilter } from '@/features/business-calendar/components/BusinessMemberFilter';
import { CalendarWeekPicker } from '@/features/business-calendar/components/CalendarWeekPicker';
import { DailyScheduleTimeline } from '@/features/business-calendar/components/DailyScheduleTimeline';
import {
  formatCalendarDayLabel,
  getBusinessMinuteOfDay,
  getWeekday,
  timeToMinutes,
} from '@/features/business-calendar/date';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { getBusinessMembers } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import {
  getBusinessWorkingHours,
  getMyMemberWorkingHours,
} from '@/features/schedules/api';
import type { BusinessWorkingHours } from '@/features/schedules/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function BusinessCalendarScreen() {
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const timeZone = activeMembership?.barbershop.timezone ?? 'Europe/Istanbul';
  const todayKey = getDateKey(new Date(), timeZone);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [workingHours, setWorkingHours] = useState<BusinessWorkingHours[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendar = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const canViewAllAppointments = can('VIEW_ALL_APPOINTMENTS');
        const canViewOwnAppointments = can('VIEW_OWN_APPOINTMENTS');
        const appointmentsRequest = canViewAllAppointments
          ? getBusinessAppointments(activeMembership.barbershop.id, token)
          : canViewOwnAppointments
            ? getMyBusinessAppointments(activeMembership.barbershop.id, token)
            : Promise.resolve([] as BusinessAppointment[]);
        const membersRequest = canViewAllAppointments
          ? getBusinessMembers(activeMembership.barbershop.id, token)
          : Promise.resolve([] as BusinessMember[]);
        const workingHoursRequest = canViewAllAppointments
          ? getBusinessWorkingHours(activeMembership.barbershop.id)
          : getMyMemberWorkingHours(activeMembership.barbershop.id, token);
        const [nextAppointments, nextMembers, nextWorkingHours] = await Promise.all([
          appointmentsRequest,
          membersRequest,
          workingHoursRequest,
        ]);

        setAppointments(nextAppointments);
        const activeMembers = nextMembers.filter((member) => member.isActive);
        setMembers(activeMembers);
        setSelectedMemberId((currentMemberId) =>
          currentMemberId && activeMembers.some((member) => member.id === currentMemberId)
            ? currentMemberId
            : null,
        );
        setWorkingHours(nextWorkingHours);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Takvim yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, can, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadCalendar();
    }, [loadCalendar]),
  );

  const selectedAppointments = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            getDateKey(new Date(appointment.startsAt), timeZone) === selectedDateKey &&
            (!selectedMemberId || appointment.businessMember.id === selectedMemberId),
        )
        .sort((first, second) => first.startsAt.localeCompare(second.startsAt)),
    [appointments, selectedDateKey, selectedMemberId, timeZone],
  );

  const selectedWorkingHours = workingHours.find(
    (item) => item.weekday === getWeekday(selectedDateKey),
  );
  const scheduleBounds = useMemo(() => {
    const appointmentStartMinutes = selectedAppointments.map((appointment) =>
      getBusinessMinuteOfDay(appointment.startsAt, timeZone),
    );
    const appointmentEndMinutes = selectedAppointments.map((appointment) =>
      Math.max(
        getBusinessMinuteOfDay(appointment.endsAt, timeZone),
        getBusinessMinuteOfDay(appointment.startsAt, timeZone) + appointment.durationMinutes,
      ),
    );
    const workingStart = selectedWorkingHours ? timeToMinutes(selectedWorkingHours.startTime) : 540;
    const workingEnd = selectedWorkingHours ? timeToMinutes(selectedWorkingHours.endTime) : 1140;
    const earliest = Math.min(workingStart, ...appointmentStartMinutes);
    const latest = Math.max(workingEnd, ...appointmentEndMinutes);

    return {
      endMinute: Math.ceil(latest / 60) * 60,
      startMinute: Math.floor(earliest / 60) * 60,
    };
  }, [selectedAppointments, selectedWorkingHours, timeZone]);

  if (!activeMembership) return null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadCalendar(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <BusinessScreenHeader subtitle={activeMembership.barbershop.name} title="Takvim" />
        <CalendarWeekPicker
          onChange={setSelectedDateKey}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
        />

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error ? (
          <BusinessAppointmentState
            description={error}
            error
            onRetry={() => void loadCalendar()}
            title="Takvim yüklenemedi"
          />
        ) : null}

        {!isLoading && !error ? (
          <>
            {can('VIEW_ALL_APPOINTMENTS') ? (
              <View style={styles.filterSection}>
                <View style={styles.sectionHeading}>
                  <AppText variant="label">Çalışan</AppText>
                  <AppText color="textMuted" style={styles.memberCount} variant="bodySmall">
                    {members.length} aktif çalışan
                  </AppText>
                </View>
                <BusinessMemberFilter
                  members={members}
                  onChange={setSelectedMemberId}
                  selectedMemberId={selectedMemberId}
                />
              </View>
            ) : null}

            <View style={styles.dayHeading}>
              <View style={styles.dayTitleArea}>
                <AppText style={styles.dayTitle} variant="heading">
                  {formatCalendarDayLabel(selectedDateKey)}
                </AppText>
                <AppText color="textMuted" style={styles.hours} variant="bodySmall">
                  {selectedWorkingHours
                    ? `${selectedWorkingHours.startTime}–${selectedWorkingHours.endTime} çalışma saatleri`
                    : 'Çalışma saati tanımlı değil'}
                </AppText>
              </View>
              <View style={styles.countBadge}>
                <AppText color="primary" style={styles.count} variant="label">
                  {selectedAppointments.length}
                </AppText>
              </View>
            </View>

            {!selectedWorkingHours && !selectedAppointments.length ? (
              <View style={styles.closedCard}>
                <AppText variant="label">İşletme bugün kapalı</AppText>
                <AppText color="textMuted" style={styles.closedDescription} variant="bodySmall">
                  Bugün için çalışma saati veya randevu bulunmuyor.
                </AppText>
              </View>
            ) : (
              <DailyScheduleTimeline
                appointments={selectedAppointments}
                endMinute={scheduleBounds.endMinute}
                showBarber={can('VIEW_ALL_APPOINTMENTS') && !selectedMemberId}
                startMinute={scheduleBounds.startMinute}
                timeZone={timeZone}
              />
            )}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  filterSection: { marginTop: spacing.lg },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  memberCount: { fontSize: 11, lineHeight: 15 },
  dayHeading: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.lg },
  dayTitleArea: { flex: 1 },
  dayTitle: { fontSize: 16, lineHeight: 22, textTransform: 'capitalize' },
  hours: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 8,
  },
  count: { fontSize: 11, lineHeight: 15 },
  closedCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.xl,
  },
  closedDescription: { marginTop: spacing.xs, textAlign: 'center' },
});
