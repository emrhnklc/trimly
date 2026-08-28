import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getMyAppointments } from '@/features/appointments/api';
import { CustomerAppointmentCard } from '@/features/appointments/components/CustomerAppointmentCard';
import type { CustomerAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function AppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [referenceTime, setReferenceTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          appointment.status === 'CONFIRMED' &&
          new Date(appointment.startsAt).getTime() >= referenceTime,
      )
      .sort((first, second) =>
        first.startsAt.localeCompare(second.startsAt),
      );
    const nextHistory = appointments.filter(
      (appointment) => !nextUpcoming.some(({ id }) => id === appointment.id),
    );

    return { history: nextHistory, upcoming: nextUpcoming };
  }, [appointments, referenceTime]);

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
        <View style={styles.header}>
          <AppText variant="displayLarge">Randevularım</AppText>
          <AppText color="textMuted" style={styles.subtitle}>
            Yaklaşan ve geçmiş randevularını tek yerden takip et.
          </AppText>
        </View>

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
              Sana uygun işletmeyi ve saati seçerek ilk randevunu oluşturabilirsin.
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
              title="Yaklaşan"
            />
            <AppointmentSection
              appointments={history}
              emptyMessage="Geçmiş randevun bulunmuyor."
              title="Geçmiş"
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function AppointmentSection({
  appointments,
  emptyMessage,
  title,
}: {
  appointments: CustomerAppointment[];
  emptyMessage: string;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <AppText variant="heading">{title}</AppText>
        <View style={styles.countBadge}>
          <AppText color="primary" variant="label">{appointments.length}</AppText>
        </View>
      </View>
      {appointments.length ? (
        appointments.map((appointment) => (
          <CustomerAppointmentCard appointment={appointment} key={appointment.id} />
        ))
      ) : (
        <AppText color="textMuted">{emptyMessage}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  header: { marginBottom: spacing.lg },
  subtitle: { marginTop: spacing.xs },
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
  section: { marginTop: spacing.lg },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  countBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 24,
    minWidth: 24,
    paddingHorizontal: 6,
  },
});
