import { useCallback, useMemo, useState } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import {
  cancelBusinessAppointment,
  getBusinessAppointments,
  getMyBusinessAppointments,
  markBusinessAppointmentArrived,
  undoBusinessAppointmentArrival,
} from '@/features/appointments/api';
import type { BusinessAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  AppointmentPeriodTabs,
  type AppointmentPeriod,
} from '@/features/business-appointments/components/AppointmentPeriodTabs';
import { BusinessAppointmentCard } from '@/features/business-appointments/components/BusinessAppointmentCard';
import { BusinessActiveAppointmentCard } from '@/features/business-appointments/components/BusinessActiveAppointmentCard';
import { BusinessAppointmentState } from '@/features/business-appointments/components/BusinessAppointmentState';
import { formatBusinessDate, getDateKey } from '@/features/business-appointments/date';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BusinessAppointmentsRoute() {
  const { can } = useBusiness();

  if (!can('VIEW_OWN_APPOINTMENTS')) {
    return <Redirect href="/(business)/calendar" />;
  }

  return <BusinessAppointmentsScreen />;
}

function BusinessAppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [period, setPeriod] = useState<AppointmentPeriod>('today');
  const [referenceTime, setReferenceTime] = useState(() => Date.now());
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [actionAppointmentId, setActionAppointmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(
    async (refreshing = false, silent = false) => {
      if (!token || !activeMembership) return;

      if (refreshing) setRefreshing(true);
      else if (!silent) setLoading(true);
      setError(null);

      try {
        const getAppointments = can('VIEW_ALL_APPOINTMENTS')
          ? getBusinessAppointments
          : getMyBusinessAppointments;
        const nextAppointments = await getAppointments(
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

  const activeAppointment = useMemo(() => {
    const arrived = groupedAppointments.today.find(
      (appointment) => appointment.status === 'ARRIVED',
    );
    if (arrived) return arrived;

    const currentOrNext = groupedAppointments.today.find(
      (appointment) =>
        appointment.status === 'CONFIRMED' &&
        new Date(appointment.endsAt).getTime() >= referenceTime,
    );
    if (currentOrNext) return currentOrNext;

    return [...groupedAppointments.today]
      .reverse()
      .find((appointment) => appointment.status === 'CONFIRMED');
  }, [groupedAppointments.today, referenceTime]);

  if (!activeMembership) return null;

  const selectedAppointments = groupedAppointments[period];
  const listedAppointments =
    period === 'today' && activeAppointment
      ? selectedAppointments.filter((appointment) => appointment.id !== activeAppointment.id)
      : selectedAppointments;
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

  async function runAppointmentAction(
    appointment: BusinessAppointment,
    action: 'arrive' | 'undo-arrival' | 'cancel',
  ) {
    if (!token || !activeMembership) return;

    setActionAppointmentId(appointment.id);
    try {
      if (action === 'arrive') {
        await markBusinessAppointmentArrived(
          activeMembership.barbershop.id,
          appointment.id,
          token,
        );
      } else if (action === 'undo-arrival') {
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
        );
      }
      await loadAppointments(false, true);
    } catch (reason) {
      Alert.alert(
        'Randevu güncellenemedi',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    } finally {
      setActionAppointmentId(null);
    }
  }

  function confirmCancellation(appointment: BusinessAppointment) {
    Alert.alert(
      'Randevu iptal edilsin mi?',
      `${appointment.customer.firstName} ${appointment.customer.lastName} için olan randevu iptal edilecek.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Randevuyu İptal Et',
          style: 'destructive',
          onPress: () => void runAppointmentAction(appointment, 'cancel'),
        },
      ],
    );
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
        showsVerticalScrollIndicator={false}>
        <BusinessScreenHeader
          onNotificationPress={() => router.push('/notifications')}
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

        {!isLoading && !error && period === 'today' && activeAppointment ? (
          <BusinessActiveAppointmentCard
            appointment={activeAppointment}
            isSubmitting={actionAppointmentId === activeAppointment.id}
            now={referenceTime}
            onArrive={() => void runAppointmentAction(activeAppointment, 'arrive')}
            onCancel={() => confirmCancellation(activeAppointment)}
            onDetail={() =>
              router.push({
                pathname: '/business-appointments/[appointmentId]',
                params: { appointmentId: activeAppointment.id },
              })
            }
            onUndoArrival={() => void runAppointmentAction(activeAppointment, 'undo-arrival')}
            timeZone={timeZone}
          />
        ) : null}

        {!isLoading && !error && !selectedAppointments.length ? (
          <BusinessAppointmentState {...emptyMessages[period]} />
        ) : null}

        {!isLoading && !error && listedAppointments.length ? (
          <View style={styles.list}>
            {listedAppointments.map((appointment) => (
              <BusinessAppointmentCard
                appointment={appointment}
                key={appointment.id}
                onPress={() =>
                  router.push({
                    pathname: '/business-appointments/[appointmentId]',
                    params: { appointmentId: appointment.id },
                  })
                }
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
