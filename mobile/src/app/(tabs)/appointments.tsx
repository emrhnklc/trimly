import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { BrandedPageHeader } from '@/components/ui/BrandedPageHeader';
import { Screen } from '@/components/ui/Screen';
import { getMyAppointments } from '@/features/appointments/api';
import { CustomerAppointmentCard } from '@/features/appointments/components/CustomerAppointmentCard';
import type { CustomerAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [referenceTime, setReferenceTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState<string | null>(null);

  const loadAppointments = useCallback(
    async (refreshing = false) => {
      if (!token) return;

      if (refreshing) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const nextAppointments = await getMyAppointments(token);
        setAppointments(nextAppointments);
        setReferenceTime(Date.now());
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Randevular yüklenemedi.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
    }, [loadAppointments]),
  );

  const { history, upcoming } = useMemo(() => {
    const nextUpcoming = appointments
      .filter(
        (appointment) =>
          (appointment.status === 'ARRIVED' ||
            (appointment.status === 'CONFIRMED' &&
              new Date(appointment.startsAt).getTime() >= referenceTime)),
      )
      .sort((first, second) =>
        first.startsAt.localeCompare(second.startsAt),
      );
    const nextHistory = appointments
      .filter((appointment) => !nextUpcoming.some(({ id }) => id === appointment.id))
      .sort((first, second) => second.startsAt.localeCompare(first.startsAt));

    return { history: nextHistory, upcoming: nextUpcoming };
  }, [appointments, referenceTime]);

  const historyMonths = useMemo(
    () => Array.from(new Set(history.map((appointment) => getMonthKey(appointment.startsAt)))),
    [history],
  );
  const activeHistoryMonth = historyMonths.includes(selectedHistoryMonth ?? '')
    ? selectedHistoryMonth
    : (historyMonths[0] ?? null);
  const activeHistoryMonthIndex = activeHistoryMonth
    ? historyMonths.indexOf(activeHistoryMonth)
    : -1;
  const filteredHistory = activeHistoryMonth
    ? history.filter((appointment) => getMonthKey(appointment.startsAt) === activeHistoryMonth)
    : [];

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
        <BrandedPageHeader
          subtitle="Yaklaşan ve geçmiş randevularını tek yerden takip et."
          title="Randevularım"
        />

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error ? (
          <View style={styles.stateBox}>
            <SymbolView
              name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
              size={30}
              tintColor={colors.danger}
            />
            <AppText style={styles.stateTitle} variant="heading">Randevular yüklenemedi</AppText>
            <AppText color="textMuted" style={styles.stateDescription}>{error}</AppText>
            <View style={styles.stateButton}>
              <AppButton onPress={() => void loadAppointments()} variant="secondary">
                Tekrar Dene
              </AppButton>
            </View>
          </View>
        ) : null}

        {!isLoading && !error && !appointments.length ? (
          <View style={styles.stateBox}>
            <View style={styles.emptyIcon}>
              <SymbolView
                name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                size={30}
                tintColor={colors.primary}
              />
            </View>
            <AppText style={styles.stateTitle} variant="heading">Henüz randevun yok</AppText>
            <AppText color="textMuted" style={styles.stateDescription}>
              İlk randevunu kolayca oluşturabilirsin.
            </AppText>
            <View style={styles.stateButton}>
              <AppButton onPress={() => router.push('/barbers')}>Berberleri Keşfet</AppButton>
            </View>
          </View>
        ) : null}

        {!isLoading && !error && appointments.length ? (
          <View>
            <AppointmentSection
              appointments={upcoming}
              emptyMessage="Yaklaşan randevun bulunmuyor."
              onAppointmentPress={(appointmentId) =>
                router.push({
                  pathname: '/appointments/[appointmentId]',
                  params: { appointmentId },
                })
              }
              title="Yaklaşan"
            />
            <HistoryAppointmentSection
              appointments={filteredHistory}
              canGoToNewerMonth={activeHistoryMonthIndex > 0}
              canGoToOlderMonth={activeHistoryMonthIndex >= 0 && activeHistoryMonthIndex < historyMonths.length - 1}
              month={activeHistoryMonth}
              onAppointmentPress={(appointmentId) =>
                router.push({
                  pathname: '/appointments/[appointmentId]',
                  params: { appointmentId },
                })
              }
              onNextMonth={() => setSelectedHistoryMonth(historyMonths[activeHistoryMonthIndex - 1])}
              onPreviousMonth={() => setSelectedHistoryMonth(historyMonths[activeHistoryMonthIndex + 1])}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function getMonthKey(dateValue: string) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1));
}

function AppointmentSection({
  appointments,
  emptyMessage,
  onAppointmentPress,
  title,
}: {
  appointments: CustomerAppointment[];
  emptyMessage: string;
  onAppointmentPress: (appointmentId: string) => void;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="sectionTitle">{title}</AppText>
        <View style={styles.countBadge}>
          <AppText color="primary" variant="label">{appointments.length}</AppText>
        </View>
      </View>
      {appointments.length ? (
        appointments.map((appointment) => (
          <CustomerAppointmentCard
            appointment={appointment}
            key={appointment.id}
            onPress={() => onAppointmentPress(appointment.id)}
          />
        ))
      ) : (
        <AppText color="textMuted">{emptyMessage}</AppText>
      )}
    </View>
  );
}

function HistoryAppointmentSection({
  appointments,
  canGoToNewerMonth,
  canGoToOlderMonth,
  month,
  onAppointmentPress,
  onNextMonth,
  onPreviousMonth,
}: {
  appointments: CustomerAppointment[];
  canGoToNewerMonth: boolean;
  canGoToOlderMonth: boolean;
  month: string | null;
  onAppointmentPress: (appointmentId: string) => void;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
}) {
  const themeColors = useThemeColors();
  return (
    <View style={styles.section}>
      <View style={styles.historyHeader}>
        <AppText variant="sectionTitle">Geçmiş</AppText>
        {month ? (
          <View style={[styles.monthPicker, { backgroundColor: themeColors.surfaceMuted }]}>
            <MonthArrowButton
              accessibilityLabel="Önceki ay"
              disabled={!canGoToOlderMonth}
              direction="left"
              onPress={onPreviousMonth}
            />
            <AppText numberOfLines={1} style={styles.monthLabel} variant="label">{formatMonthLabel(month)}</AppText>
            <MonthArrowButton
              accessibilityLabel="Sonraki ay"
              disabled={!canGoToNewerMonth}
              direction="right"
              onPress={onNextMonth}
            />
          </View>
        ) : null}
      </View>
      {appointments.length ? (
        appointments.map((appointment) => (
          <CustomerAppointmentCard
            appointment={appointment}
            key={appointment.id}
            onPress={() => onAppointmentPress(appointment.id)}
          />
        ))
      ) : (
        <AppText color="textMuted">Geçmiş randevun bulunmuyor.</AppText>
      )}
    </View>
  );
}

function MonthArrowButton({
  accessibilityLabel,
  direction,
  disabled,
  onPress,
}: {
  accessibilityLabel: string;
  direction: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.monthArrow,
        disabled && styles.monthArrowDisabled,
        pressed && styles.monthArrowPressed,
      ]}>
      <SymbolView
        name={
          direction === 'left'
            ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
            : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
        }
        size={14}
        tintColor={themeColors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
  stateBox: { alignItems: 'center', marginTop: spacing.xxxl, paddingHorizontal: spacing.lg },
  stateTitle: { marginTop: spacing.sm, textAlign: 'center' },
  stateDescription: { marginTop: spacing.xs, maxWidth: 320, textAlign: 'center' },
  stateButton: { marginTop: spacing.xl, minWidth: 220 },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  section: { marginTop: layout.sectionGap },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  historyHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  monthPicker: { alignItems: 'center', borderRadius: radius.pill, flexDirection: 'row', height: 30, paddingHorizontal: 2 },
  monthArrow: { alignItems: 'center', height: 30, justifyContent: 'center', width: 30 },
  monthArrowDisabled: { opacity: 0.35 },
  monthArrowPressed: { opacity: 0.65 },
  monthLabel: { fontSize: 11, minWidth: 98, textAlign: 'center' },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 5,
  },
});
