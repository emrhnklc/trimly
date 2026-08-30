import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getBookingSettings } from '@/features/barbershops/api';
import type { BookingSettings } from '@/features/barbershops/types';
import { getDateKey } from '@/features/business-appointments/date';
import {
  getDailyBusinessSummary,
  getManagementServices,
} from '@/features/business-management/api';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { ManagementDailySummaryCard } from '@/features/business-management/components/ManagementDailySummaryCard';
import {
  ManagementMenuSection,
  type ManagementMenuItem,
} from '@/features/business-management/components/ManagementMenuSection';
import { ManagementMetricCard } from '@/features/business-management/components/ManagementMetricCard';
import { formatTurkishPrice } from '@/features/business-management/format';
import type {
  DailyBusinessSummary,
  ManagementService,
} from '@/features/business-management/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessScreenHeader } from '@/features/business/components/BusinessScreenHeader';
import { getBusinessMembers } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { getBusinessWorkingHours } from '@/features/schedules/api';
import type { BusinessWorkingHours } from '@/features/schedules/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type ManagementData = {
  bookingSettings: BookingSettings;
  members: BusinessMember[];
  services: ManagementService[];
  summary: DailyBusinessSummary;
  workingHours: BusinessWorkingHours[];
};

function formatNotice(minutes: number) {
  if (minutes < 60) return `${minutes} dk`;
  if (minutes % 60 === 0) return `${minutes / 60} saat`;
  return `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}

export default function BusinessManagementScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [data, setData] = useState<ManagementData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadManagement = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const barbershopId = activeMembership.barbershop.id;
        const today = getDateKey(new Date(), activeMembership.barbershop.timezone);
        const [services, members, workingHours, bookingSettings, summary] = await Promise.all([
          getManagementServices(barbershopId, token),
          getBusinessMembers(barbershopId, token),
          getBusinessWorkingHours(barbershopId),
          getBookingSettings(barbershopId),
          getDailyBusinessSummary(barbershopId, today, token),
        ]);

        setData({ bookingSettings, members, services, summary, workingHours });
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Yönetim bilgileri yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadManagement();
    }, [loadManagement]),
  );

  const overview = useMemo(() => {
    if (!data) return null;

    const activeServices = data.services.filter((service) => service.isActive);
    const activeMembers = data.members.filter((member) => member.isActive);
    const bookableMembers = activeMembers.filter((member) => member.isBookable);
    const cancellationDescription = data.bookingSettings.customerCancellationEnabled
      ? `İptal sınırı ${formatNotice(data.bookingSettings.cancellationNoticeMinutes)}`
      : 'Müşteri iptali kapalı';
    const menuItems: ManagementMenuItem[] = [
      {
        description: 'Fiyat, süre ve aktiflik durumlarını yönet',
        icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
        id: 'services',
        onPress: () => router.push('/management/services'),
        title: 'Hizmetler',
        value: `${activeServices.length} aktif`,
      },
      {
        description: `${bookableMembers.length} çalışan randevuya açık`,
        icon: { ios: 'person.2', android: 'group', web: 'group' },
        id: 'members',
        onPress: () => router.push('/management/members'),
        title: 'Çalışanlar',
        value: `${activeMembers.length} kişi`,
      },
      {
        description: 'Vardiya, mola ve izin planlarını düzenle',
        icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
        id: 'hours',
        onPress: () => router.push('/management/hours'),
        title: 'Çalışma Saatleri',
        value: `${data.workingHours.length} gün açık`,
      },
      {
        description: `${cancellationDescription} · ${formatNotice(data.bookingSettings.minBookingNoticeMinutes)} ön bildirim`,
        icon: { ios: 'calendar.badge.clock', android: 'event_note', web: 'event_note' },
        id: 'booking',
        onPress: () => router.push('/management/booking'),
        title: 'Randevu Ayarları',
        value: `${data.bookingSettings.maxBookingAdvanceDays} gün ileri`,
      },
      {
        description: 'Ciroyu ve çalışan performansını incele',
        icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
        id: 'revenue',
        onPress: () => router.push('/management/revenue'),
        title: 'Gelirler',
        value: formatTurkishPrice(data.summary.completedRevenue),
      },
      {
        description: 'İşletme profili, konumu ve görünürlüğü',
        icon: { ios: 'storefront', android: 'storefront', web: 'storefront' },
        id: 'business',
        onPress: () => router.push('/management/business'),
        title: 'İşletme Ayarları',
        value: 'Owner',
      },
    ];

    return { activeMembers, activeServices, menuItems };
  }, [data, router]);

  if (!activeMembership) return null;

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadManagement(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        <BusinessScreenHeader subtitle={activeMembership.barbershop.name} title="Yönetim" />

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && error ? (
          <BusinessManagementState
            description={error}
            onRetry={() => void loadManagement()}
            title="Yönetim bilgileri yüklenemedi"
          />
        ) : null}

        {!isLoading && !error && data && overview ? (
          <>
            <ManagementDailySummaryCard summary={data.summary} />

            <View style={styles.metrics}>
              <ManagementMetricCard
                icon={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
                label="Aktif hizmet"
                value={`${overview.activeServices.length}/${data.services.length}`}
              />
              <ManagementMetricCard
                icon={{ ios: 'person.2', android: 'group', web: 'group' }}
                label="Aktif çalışan"
                value={`${overview.activeMembers.length}`}
              />
              <ManagementMetricCard
                icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                label="Açık gün"
                value={`${data.workingHours.length}/7`}
              />
              <ManagementMetricCard
                icon={{ ios: 'clock.arrow.circlepath', android: 'schedule', web: 'schedule' }}
                label="Randevu aralığı"
                value={`${data.bookingSettings.slotIntervalMinutes} dk`}
              />
            </View>

            <AppText style={styles.sectionTitle} variant="heading">İşletmeni yönet</AppText>
            <AppText color="textMuted" style={styles.sectionDescription} variant="bodySmall">
              Hizmet, ekip, çalışma düzeni ve işletme ayarlarının güncel özeti.
            </AppText>
            <View style={styles.menu}>
              <ManagementMenuSection items={overview.menuItems} />
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontSize: 18, lineHeight: 24, marginTop: spacing.xl },
  sectionDescription: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  menu: { marginTop: spacing.sm },
});
