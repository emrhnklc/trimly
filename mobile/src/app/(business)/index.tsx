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
import { getBusinessAppointments } from '@/features/appointments/api';
import type { BusinessAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  AppointmentPeriodTabs,
  type AppointmentPeriod,
} from '@/features/business-appointments/components/AppointmentPeriodTabs';
import { BusinessAppointmentCard } from '@/features/business-appointments/components/BusinessAppointmentCard';
import { BusinessAppointmentState } from '@/features/business-appointments/components/BusinessAppointmentState';
import { formatBusinessDate, getDateKey } from '@/features/business-appointments/date';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BusinessAppointmentsScreen() {
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [period, setPeriod] = useState<AppointmentPeriod>('today');
  const [referenceTime, setReferenceTime] = useState(() => Date.now());
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(
    async (refreshing = false) => {
      if (!token || !activeMembership) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const nextAppointments = await getBusinessAppointments(
          activeMembership.barbershop.id,
          token,
        );
        setAppointments(nextAppointments);
        setReferenceTime(Date.now());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Randevular yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
    }, [loadAppointments]),
  );

  const groupedAppointments = useMemo(() => {
    if (!activeMembership) return { history: [], today: [], upcoming: [] };

    const timeZone = activeMembership.barbershop.timezone;
    const todayKey = getDateKey(new Date(referenceTime), timeZone);
    const today = appointments
      .filter((appointment) => getDateKey(new Date(appointment.startsAt), timeZone) === todayKey)
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
    const todayIds = new Set(today.map((appointment) => appointment.id));
    const upcoming = appointments
      .filter(
        (appointment) =>
          !todayIds.has(appointment.id) &&
          appointment.status === 'CONFIRMED' &&
          new Date(appointment.startsAt).getTime() > referenceTime,
      )
      .sort((first, second) => first.startsAt.localeCompare(second.startsAt));
    const upcomingIds = new Set(upcoming.map((appointment) => appointment.id));
    const history = appointments
      .filter(
        (appointment) => !todayIds.has(appointment.id) && !upcomingIds.has(appointment.id),
      )
      .sort((first, second) => second.startsAt.localeCompare(first.startsAt));

    return { history, today, upcoming };
  }, [activeMembership, appointments, referenceTime]);

  if (!activeMembership) return null;

  const selectedAppointments = groupedAppointments[period];
  const timeZone = activeMembership.barbershop.timezone;
  const emptyMessages: Record<AppointmentPeriod, { description: string; title: string }> = {
    today: {
      description: 'Bugün için planlanmış bir randevu bulunmuyor.',
      title: 'Bugün takvim sakin',
    },
    upcoming: {
      description: 'Bugünden sonraki onaylı randevular burada görünecek.',
      title: 'Yaklaşan randevu yok',
    },
    history: {
      description: 'Tamamlanan, iptal edilen ve geçmiş randevular burada birikecek.',
      title: 'Geçmiş henüz boş',
    },
  };

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
        showsVerticalScrollIndicator={false}>
        <BusinessScreenHeader
          showNotification
          subtitle={activeMembership.barbershop.name}
          title="Randevular"
        />
        <AppointmentPeriodTabs onChange={setPeriod} value={period} />

        <View style={styles.dateRow}>
          <AppText style={styles.date} variant="label">
            {formatBusinessDate(new Date(referenceTime), timeZone)}
          </AppText>
          <View style={styles.countBadge}>
            <AppText color="primary" style={styles.count} variant="label">
              {selectedAppointments.length}
            </AppText>
          </View>
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error ? (
          <BusinessAppointmentState
            description={error}
            error
            onRetry={() => void loadAppointments()}
            title="Randevular yüklenemedi"
          />
        ) : null}

        {!isLoading && !error && !selectedAppointments.length ? (
          <BusinessAppointmentState {...emptyMessages[period]} />
        ) : null}

        {!isLoading && !error && selectedAppointments.length ? (
          <View style={styles.list}>
            {selectedAppointments.map((appointment) => (
              <BusinessAppointmentCard
                appointment={appointment}
                key={appointment.id}
                timeZone={timeZone}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  dateRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.lg },
  date: { flex: 1, textTransform: 'capitalize' },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
  },
  count: { fontSize: 11, lineHeight: 15 },
  loader: { marginTop: spacing.xxxl },
  list: { marginTop: spacing.md },
});
