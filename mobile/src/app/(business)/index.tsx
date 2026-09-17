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
import { AppIconButton } from '@/components/ui/AppIconButton';
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
import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
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
  const { language, translate } = useAppPreferences();
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const [appointments, setAppointments] = useState<BusinessAppointment[]>([]);
  const [period, setPeriod] = useState<AppointmentPeriod>('today');
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string | null>(null);
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

  const historyMonths = useMemo(
    () => Array.from(new Set(groupedAppointments.history.map((appointment) => getDateKey(
      new Date(appointment.startsAt),
      activeMembership?.barbershop.timezone ?? 'Europe/Istanbul',
    ).slice(0, 7)))),
    [activeMembership?.barbershop.timezone, groupedAppointments.history],
  );

  if (!activeMembership) return null;

  const activeHistoryMonth = historyMonths.includes(selectedHistoryMonth ?? '')
    ? selectedHistoryMonth
    : (historyMonths[0] ?? null);
  const activeHistoryMonthIndex = activeHistoryMonth ? historyMonths.indexOf(activeHistoryMonth) : -1;
  const selectedAppointments = period === 'history' && activeHistoryMonth
    ? groupedAppointments.history.filter((appointment) =>
      getDateKey(new Date(appointment.startsAt), activeMembership.barbershop.timezone)
        .startsWith(activeHistoryMonth),
    )
    : groupedAppointments[period];
  const listedAppointments =
    period === 'today' && activeAppointment
      ? selectedAppointments.filter((appointment) => appointment.id !== activeAppointment.id)
      : selectedAppointments;
  const timeZone = activeMembership.barbershop.timezone;
  const emptyMessages: Record<AppointmentPeriod, { description: string; title: string }> = {
    today: {
      description: translate(
        'Bugün için planlanmış bir randevu bulunmuyor.',
        'There are no appointments scheduled for today.',
      ),
      title: translate('Bugün takvim sakin', 'Your calendar is clear today'),
    },
    upcoming: {
      description: translate(
        'Bugünden sonraki onaylı randevular burada görünecek.',
        'Confirmed future appointments will appear here.',
      ),
      title: translate('Yaklaşan randevu yok', 'No upcoming appointments'),
    },
    history: {
      description: translate(
        'Tamamlanan, iptal edilen ve geçmiş randevular burada birikecek.',
        'Completed, cancelled and past appointments will appear here.',
      ),
      title: translate('Geçmiş henüz boş', 'No appointment history yet'),
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
          title={translate('Randevular', 'Appointments')}
        />
        <AppointmentPeriodTabs onChange={setPeriod} value={period} />

        <View style={styles.dateRow}>
          {period === 'history' ? (
            activeHistoryMonth ? (
              <View style={styles.monthPicker}>
                <AppIconButton
                  accessibilityLabel="Önceki ay"
                  disabled={activeHistoryMonthIndex >= historyMonths.length - 1}
                  icon={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                  onPress={() => setSelectedHistoryMonth(historyMonths[activeHistoryMonthIndex + 1])}
                  size={17}
                  variant="transparent"
                />
                <AppText numberOfLines={1} style={styles.monthLabel} variant="label">
                  {formatMonthLabel(activeHistoryMonth, language)}
                </AppText>
                <AppIconButton
                  accessibilityLabel="Sonraki ay"
                  disabled={activeHistoryMonthIndex <= 0}
                  icon={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  onPress={() => setSelectedHistoryMonth(historyMonths[activeHistoryMonthIndex - 1])}
                  size={17}
                  variant="transparent"
                />
              </View>
            ) : <AppText style={styles.date} variant="label">{translate('Geçmiş', 'History')}</AppText>
          ) : (
            <AppText style={styles.date} variant="label">
              {formatBusinessDate(
                new Date(referenceTime),
                timeZone,
                language === 'en' ? 'en-US' : 'tr-TR',
              )}
            </AppText>
          )}
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
            title={translate('Randevular yüklenemedi', 'Appointments could not be loaded')}
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

function formatMonthLabel(monthKey: string, language: 'en' | 'tr') {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1));
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg },
  dateRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.lg },
  date: { flex: 1, textTransform: 'capitalize' },
  monthPicker: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 999, flexDirection: 'row', height: 34, paddingHorizontal: 2 },
  monthLabel: { fontSize: 11, minWidth: 106, textAlign: 'center' },
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
