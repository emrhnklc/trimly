import { useCallback, useMemo, useRef, useState } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getBarbershopReadiness,
  getBookingSettings,
  getPublicBarbershop,
  updateBarbershopProfile,
} from '@/features/barbershops/api';
import type {
  BarbershopReadiness,
  BookingSettings,
} from '@/features/barbershops/types';
import { getDateKey } from '@/features/business-appointments/date';
import {
  getDailyBusinessSummary,
  getManagementServices,
} from '@/features/business-management/api';
import { BusinessManagementState } from '@/features/business-management/components/BusinessManagementState';
import { BusinessBookingStatusSheet } from '@/features/business-management/components/BusinessBookingStatusSheet';
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
import { businessRoleLabels } from '@/features/business/role-labels';
import { getBusinessMembers } from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { getBusinessWorkingHours } from '@/features/schedules/api';
import type { BusinessWorkingHours } from '@/features/schedules/types';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type ManagementData = {
  acceptsBookings: boolean;
  bookingSettings: BookingSettings;
  members: BusinessMember[];
  services: ManagementService[];
  summary: DailyBusinessSummary;
  workingHours: BusinessWorkingHours[];
  isDiscoverable: boolean;
  isBookingOpen: boolean;
  readiness: BarbershopReadiness;
};

function formatNotice(minutes: number) {
  if (minutes < 60) return `${minutes} dk`;
  if (minutes % 60 === 0) return `${minutes / 60} saat`;
  return `${Math.floor(minutes / 60)} sa ${minutes % 60} dk`;
}

export default function BusinessManagementRoute() {
  const { can } = useBusiness();

  if (!can('MANAGE_SERVICES')) {
    return <Redirect href="/(business)/calendar" />;
  }

  return <BusinessManagementScreen />;
}

function BusinessManagementScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { token } = useAuth();
  const { activeMembership, markBusinessPublished } = useBusiness();
  const [data, setData] = useState<ManagementData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishing, setPublishing] = useState(false);
  const [isStatusSheetVisible, setStatusSheetVisible] = useState(false);
  const loadedBusinessId = useRef<string | null>(null);
  const loadVersion = useRef(0);

  const loadManagement = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token) return;

      const requestVersion = ++loadVersion.current;
      const isCurrentRequest = () => requestVersion === loadVersion.current;

      if (refreshing) setRefreshing(true);
      else if (loadedBusinessId.current !== activeMembership.barbershop.id) {
        setLoading(true);
      }
      setError(null);

      try {
        const barbershopId = activeMembership.barbershop.id;
        const today = getDateKey(
          new Date(),
          activeMembership.barbershop.timezone,
        );
        const [
          services,
          members,
          workingHours,
          bookingSettings,
          summary,
          profile,
          readiness,
        ] = await Promise.all([
          getManagementServices(barbershopId, token),
          getBusinessMembers(barbershopId, token),
          getBusinessWorkingHours(barbershopId),
          getBookingSettings(barbershopId),
          getDailyBusinessSummary(barbershopId, today, token),
          getPublicBarbershop(activeMembership.barbershop.slug),
          getBarbershopReadiness(barbershopId, token),
        ]);

        if (isCurrentRequest()) {
          setData({
            acceptsBookings: readiness.acceptsBookings,
            bookingSettings,
            isDiscoverable: profile.isDiscoverable,
            isBookingOpen: readiness.isBookingOpen,
            members,
            readiness,
            services,
            summary,
            workingHours,
          });
          loadedBusinessId.current = barbershopId;
        }
      } catch (reason) {
        if (isCurrentRequest()) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'Yönetim bilgileri yüklenemedi.',
          );
        }
      } finally {
        if (isCurrentRequest()) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [activeMembership, token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadManagement();

      return () => {
        loadVersion.current += 1;
      };
    }, [loadManagement]),
  );

  const overview = useMemo(() => {
    if (!data) return null;

    const activeServices = data.services.filter((service) => service.isActive);
    const activeMembers = data.members.filter((member) => member.isActive);
    const bookableMembers = activeMembers.filter(
      (member) =>
        member.isBookable &&
        member.serviceAssignments.some(
          (assignment) => assignment.service.isActive,
        ),
    );
    const cancellationDescription = data.bookingSettings
      .customerCancellationEnabled
      ? `İptal sınırı ${formatNotice(data.bookingSettings.cancellationNoticeMinutes)}`
      : 'Müşteri iptali kapalı';
    const menuItems: ManagementMenuItem[] = [
      {
        description: 'İşletme profili, konumu ve görünürlüğü',
        icon: { ios: 'storefront', android: 'storefront', web: 'storefront' },
        id: 'business',
        onPress: () => router.push('/(business)/management/business'),
        title: 'İşletme Ayarları',
        value: activeMembership
          ? businessRoleLabels[activeMembership.role]
          : 'İşletme',
      },
      {
        description: 'Fiyat, süre ve aktiflik durumlarını yönet',
        icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
        id: 'services',
        onPress: () => router.push('/(business)/management/services'),
        title: 'Hizmetler',
        value: `${activeServices.length} aktif`,
      },
      {
        description: 'Hizmetlere süreli fırsatlar tanımla',
        icon: { ios: 'tag', android: 'local_offer', web: 'local_offer' },
        id: 'campaigns',
        onPress: () => router.push('/(business)/management/campaigns'),
        title: 'Kampanyalar',
        value: 'Yönet',
      },
      {
        description: `${bookableMembers.length} çalışan randevuya açık`,
        icon: { ios: 'person.2', android: 'group', web: 'group' },
        id: 'members',
        onPress: () => router.push('/(business)/management/members'),
        title: 'Çalışanlar',
        value: `${activeMembers.length} kişi`,
      },
      {
        description: 'Vardiya, mola ve izin planlarını düzenle',
        icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
        id: 'hours',
        onPress: () => router.push('/(business)/management/hours'),
        title: 'Çalışma Saatleri',
        value: `${data.workingHours.length} gün açık`,
      },
      {
        description: `${cancellationDescription} · ${formatNotice(data.bookingSettings.minBookingNoticeMinutes)} ön bildirim`,
        icon: {
          ios: 'calendar.badge.clock',
          android: 'event_note',
          web: 'event_note',
        },
        id: 'booking',
        onPress: () => router.push('/(business)/management/booking'),
        title: 'Randevu Ayarları',
        value: `${data.bookingSettings.maxBookingAdvanceDays} gün ileri`,
      },
      {
        description: 'Ciroyu ve çalışan performansını incele',
        icon: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
        id: 'revenue',
        onPress: () => router.push('/(business)/management/revenue'),
        title: 'Gelirler',
        value: formatTurkishPrice(data.summary.completedRevenue),
      },
    ];

    return { activeMembers, activeServices, bookableMembers, menuItems };
  }, [activeMembership, data, router]);

  const setupSteps = useMemo(() => {
    if (!data) return [];

    return [
      {
        completed: data.readiness.checks.activeService,
        description: 'En az bir aktif hizmet',
        icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
        id: 'service',
        onPress: () => router.push('/management/services/new'),
        title: 'Hizmet ekle',
      },
      {
        completed: data.readiness.checks.bookableMember,
        description: 'Hizmete atanmış, randevuya açık',
        icon: { ios: 'person.2', android: 'group', web: 'group' },
        id: 'member',
        onPress: () => router.push('/management/members'),
        title: 'Çalışan ayarla',
      },
      {
        completed: data.readiness.checks.businessHours,
        description: 'İşletme saatlerini belirle',
        icon: { ios: 'clock', android: 'schedule', web: 'schedule' },
        id: 'business-hours',
        onPress: () => router.push('/management/hours'),
        title: 'Çalışma saatleri',
      },
      {
        completed: data.readiness.checks.memberWorkingHours,
        description: 'Çalışanın hizmete uygun vardiyası',
        icon: {
          ios: 'calendar.badge.clock',
          android: 'edit_calendar',
          web: 'edit_calendar',
        },
        id: 'member-hours',
        onPress: () => router.push('/management/hours/members'),
        title: 'Vardiya planı',
      },
    ] satisfies {
      completed: boolean;
      description: string;
      icon: SymbolViewProps['name'];
      id: string;
      onPress: () => void;
      title: string;
    }[];
  }, [data, router]);

  if (!activeMembership) return null;

  async function publishBusiness() {
    if (!token || !activeMembership || isPublishing) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await updateBarbershopProfile(
        activeMembership.barbershop.id,
        { acceptsBookings: true, isDiscoverable: true },
        token,
      );
      markBusinessPublished(activeMembership.barbershop.id);
      setData((current) =>
        current
          ? {
              ...current,
              acceptsBookings: true,
              isBookingOpen: true,
              isDiscoverable: true,
            }
          : current,
      );
      router.replace('/(business)');
    } catch (reason) {
      setPublishError(
        reason instanceof Error ? reason.message : 'İşletme yayınlanamadı.',
      );
    } finally {
      setPublishing(false);
    }
  }

  async function setBookingAcceptance(acceptsBookings: boolean) {
    if (!token || !activeMembership || isPublishing) return;
    setPublishing(true);
    setPublishError(null);
    try {
      await updateBarbershopProfile(
        activeMembership.barbershop.id,
        { acceptsBookings },
        token,
      );
      await loadManagement(true);
      setStatusSheetVisible(false);
    } catch (reason) {
      setPublishError(
        reason instanceof Error
          ? reason.message
          : 'Randevu durumu güncellenemedi.',
      );
    } finally {
      setPublishing(false);
    }
  }

  function confirmPublishBusiness() {
    Alert.alert(
      'Kurulum tamamlansın mı?',
      'İşletmen keşfette görünür olacak ve müşteriler uygun saatlerden randevu alabilecek.',
      [
        { style: 'cancel', text: 'Vazgeç' },
        { onPress: () => void publishBusiness(), text: 'Kurulumu Tamamla' },
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
            onRefresh={() => void loadManagement(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <BusinessScreenHeader
          subtitle={activeMembership.barbershop.name}
          title="Yönetim"
          titleAccessory={
            data?.isDiscoverable ? (
              <AppIconButton
                accessibilityLabel={
                  data.isBookingOpen
                    ? 'Randevu durumu: açık'
                    : 'Randevu durumu: kapalı'
                }
                color={data.isBookingOpen ? 'success' : 'primary'}
                icon={
                  data.isBookingOpen
                    ? {
                        ios: 'calendar.badge.checkmark',
                        android: 'event_available',
                        web: 'event_available',
                      }
                    : {
                        ios: 'calendar.badge.exclamationmark',
                        android: 'event_busy',
                        web: 'event_busy',
                      }
                }
                onPress={() => setStatusSheetVisible(true)}
                size={26}
              />
            ) : undefined
          }
        />

        {!isLoading && !error && data?.isDiscoverable && !data.isBookingOpen ? (
          <Pressable
            accessibilityLabel="Kapalı randevu durumunu incele"
            accessibilityRole="button"
            onPress={() => setStatusSheetVisible(true)}
            style={({ pressed }) => [
              styles.bookingClosedCard,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.primary,
              },
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.bookingClosedIcon,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <SymbolView
                name={{
                  ios: 'calendar.badge.exclamationmark',
                  android: 'event_busy',
                  web: 'event_busy',
                }}
                size={23}
                tintColor={themeColors.primary}
              />
            </View>
            <View style={styles.bookingClosedCopy}>
              <AppText variant="label">Randevu alımı kapalı</AppText>
              <AppText color="textMuted" variant="bodySmall">
                {data.readiness.missingRequirements.length
                  ? 'Eksikleri görüp randevuları açmak için dokun.'
                  : 'Müşterilerin yeniden randevu alabilmesi için dokun.'}
              </AppText>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.right',
                android: 'chevron_right',
                web: 'chevron_right',
              }}
              size={18}
              tintColor={themeColors.primary}
            />
          </Pressable>
        ) : null}

        {!isLoading && error ? (
          <BusinessManagementState
            description={error}
            onRetry={() => void loadManagement()}
            title="Yönetim bilgileri yüklenemedi"
          />
        ) : null}

        {!isLoading && !error && data && overview ? (
          <>
            {!data.isDiscoverable ? (
              <View style={styles.setupSection}>
                <AppCard style={styles.setupIntroCard}>
                  <View style={styles.setupIntroCopy}>
                    <AppText color="primary" variant="overline">
                      KURULUM DEVAM EDİYOR
                    </AppText>
                    <AppText style={styles.setupTitle} variant="heading">
                      İşletmeni yayına hazırla
                    </AppText>
                    <AppText
                      color="textMuted"
                      style={styles.setupDescription}
                      variant="bodySmall"
                    >
                      Kurulum tamamlanana kadar işletmen keşfette görünmez ve
                      müşteri randevusu alamaz.
                    </AppText>
                  </View>
                  <SetupProgressRing
                    completed={
                      setupSteps.filter((step) => step.completed).length
                    }
                    total={setupSteps.length}
                  />
                </AppCard>

                <AppCard style={styles.setupStepsCard}>
                  <View style={styles.setupStepsHeading}>
                    <View
                      style={[
                        styles.setupHeadingIcon,
                        { backgroundColor: themeColors.surfaceMuted },
                      ]}
                    >
                      <SymbolView
                        name={{
                          ios: 'clock.fill',
                          android: 'schedule',
                          web: 'schedule',
                        }}
                        size={18}
                        tintColor={themeColors.primary}
                      />
                    </View>
                    <AppText color="primary" variant="overline">
                      SIRADAKİ ADIMLAR
                    </AppText>
                  </View>

                  <View style={styles.setupStepList}>
                    {setupSteps
                      .filter((step) => !step.completed)
                      .map((step) => (
                        <Pressable
                          accessibilityRole="button"
                          key={step.id}
                          onPress={step.onPress}
                          style={({ pressed }) => [
                            styles.setupStepCard,
                            {
                              backgroundColor: themeColors.surfaceMuted,
                              borderColor: themeColors.border,
                            },
                            pressed && styles.pressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.setupStepIcon,
                              { backgroundColor: themeColors.surface },
                            ]}
                          >
                            <SymbolView
                              name={step.icon}
                              size={23}
                              tintColor={themeColors.primary}
                            />
                          </View>
                          <View style={styles.setupStepCopy}>
                            <AppText variant="label">{step.title}</AppText>
                            <AppText color="textMuted" variant="bodySmall">
                              {step.description}
                            </AppText>
                          </View>
                          <View
                            style={[
                              styles.setupStepArrow,
                              { backgroundColor: themeColors.primary },
                            ]}
                          >
                            <SymbolView
                              name={{
                                ios: 'chevron.right',
                                android: 'chevron_right',
                                web: 'chevron_right',
                              }}
                              size={17}
                              tintColor={themeColors.onPrimary}
                            />
                          </View>
                        </Pressable>
                      ))}
                    {setupSteps.every((step) => step.completed) ? (
                      <View
                        style={[
                          styles.setupReadyCard,
                          { backgroundColor: themeColors.successSurface },
                        ]}
                      >
                        <SymbolView
                          name={{
                            ios: 'checkmark.circle.fill',
                            android: 'check_circle',
                            web: 'check_circle',
                          }}
                          size={24}
                          tintColor={themeColors.success}
                        />
                        <AppText color="success" variant="label">
                          Bütün yönetim adımları hazır
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {publishError ? (
                    <AppText
                      color="danger"
                      style={styles.publishError}
                      variant="bodySmall"
                    >
                      {publishError}
                    </AppText>
                  ) : null}
                  <AppButton
                    disabled={
                      isPublishing ||
                      !setupSteps.every((step) => step.completed)
                    }
                    onPress={confirmPublishBusiness}
                  >
                    {isPublishing ? 'Tamamlanıyor…' : 'Kurulumu Tamamla  →'}
                  </AppButton>
                </AppCard>
              </View>
            ) : null}
            <ManagementDailySummaryCard summary={data.summary} />

            <View style={styles.metrics}>
              <ManagementMetricCard
                icon={{
                  ios: 'scissors',
                  android: 'content_cut',
                  web: 'content_cut',
                }}
                label="Aktif hizmet"
                value={`${overview.activeServices.length}/${data.services.length}`}
              />
              <ManagementMetricCard
                icon={{ ios: 'person.2', android: 'group', web: 'group' }}
                label="Aktif çalışan"
                value={`${overview.activeMembers.length}`}
              />
              <ManagementMetricCard
                icon={{
                  ios: 'calendar',
                  android: 'calendar_month',
                  web: 'calendar_month',
                }}
                label="Açık gün"
                value={`${data.workingHours.length}/7`}
              />
              <ManagementMetricCard
                icon={{
                  ios: 'clock.arrow.circlepath',
                  android: 'schedule',
                  web: 'schedule',
                }}
                label="Randevu aralığı"
                value={`${data.bookingSettings.slotIntervalMinutes} dk`}
              />
            </View>

            <AppText style={styles.sectionTitle} variant="sectionTitle">
              İşletmeni yönet
            </AppText>
            <View style={styles.menu}>
              <ManagementMenuSection items={overview.menuItems} />
            </View>
          </>
        ) : null}
      </ScrollView>
      {data?.isDiscoverable ? (
        <BusinessBookingStatusSheet
          error={publishError}
          isUpdating={isPublishing}
          onClose={() => setStatusSheetVisible(false)}
          onFixRequirement={(requirement) => {
            setStatusSheetVisible(false);
            if (
              [
                'LOCATION',
                'PHONE',
                'PROFILE_PHOTO',
                'COVER_PHOTO',
                'GALLERY_PHOTOS',
              ].includes(requirement)
            )
              router.push('/management/business');
            else if (requirement === 'ACTIVE_SERVICE')
              router.push('/management/services/new');
            else if (requirement === 'BOOKABLE_MEMBER')
              router.push('/management/members');
            else if (requirement === 'BUSINESS_HOURS')
              router.push('/management/hours');
            else router.push('/management/hours/members');
          }}
          onSetBookingAcceptance={(acceptsBookings) =>
            void setBookingAcceptance(acceptsBookings)
          }
          readiness={data.readiness}
          visible={isStatusSheetVisible}
        />
      ) : null}
    </Screen>
  );
}

function SetupProgressRing({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const themeColors = useThemeColors();
  const size = 78;
  const strokeWidth = 9;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const progress = total ? completed / total : 0;

  return (
    <View style={styles.progressRing}>
      <Svg height={size} width={size} style={styles.progressSvg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue}
          stroke={themeColors.surfaceMuted}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
          stroke={themeColors.primary}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
      <AppText style={styles.progressText} variant="heading">
        {completed}/{total}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 116,
    paddingHorizontal: layout.screenHorizontalPadding,
  },
  loader: { marginTop: spacing.xxxl },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginTop: layout.sectionGap },
  menu: { marginTop: spacing.sm },
  pressed: { opacity: 0.78 },
  bookingClosedCard: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.sm,
  },
  bookingClosedIcon: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  bookingClosedCopy: { flex: 1, gap: 2 },
  setupSection: { gap: spacing.sm, marginBottom: spacing.md },
  setupIntroCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  setupIntroCopy: { flex: 1 },
  setupTitle: { marginTop: spacing.xxs },
  setupDescription: { lineHeight: 18, marginTop: spacing.xs },
  progressRing: {
    alignItems: 'center',
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  progressSvg: { position: 'absolute' },
  progressText: { fontSize: 18, lineHeight: 23 },
  setupStepsCard: { gap: spacing.md, padding: spacing.md },
  setupStepsHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  setupHeadingIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  setupStepList: { gap: spacing.xs },
  setupStepCard: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    padding: spacing.sm,
  },
  setupStepIcon: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  setupStepCopy: { flex: 1, gap: 2, marginHorizontal: spacing.sm },
  setupStepArrow: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  setupReadyCard: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  publishError: { lineHeight: 18, marginTop: spacing.sm },
});
