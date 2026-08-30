import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { getMyAppointments } from '@/features/appointments/api';
import { BookingBarberCard } from '@/features/appointments/components/BookingBarberCard';
import {
  BookingDatePicker,
  type BookingDateOption,
} from '@/features/appointments/components/BookingDatePicker';
import { BookingFlowHeader } from '@/features/appointments/components/BookingFlowHeader';
import type { BookingStep } from '@/features/appointments/components/BookingProgress';
import { BookingServiceCard } from '@/features/appointments/components/BookingServiceCard';
import { BookingShopSummary } from '@/features/appointments/components/BookingShopSummary';
import { BookingStartScreen } from '@/features/appointments/components/BookingStartScreen';
import { BookingTimePicker } from '@/features/appointments/components/BookingTimePicker';
import type { CustomerAppointment } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getAvailability,
  getBookableBarbers,
  getBookingSettings,
  getPublicBarbershop,
  getPublicBarbershops,
} from '@/features/barbershops/api';
import type {
  AvailabilitySlot,
  BookableBarber,
  BookingSettings,
  PublicBarbershop,
  PublicBarbershopDetail,
} from '@/features/barbershops/types';
import { getFavoriteBarbershops } from '@/features/favorites/api';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const defaultBookingSettings: BookingSettings = {
  minBookingNoticeMinutes: 60,
  maxBookingAdvanceDays: 14,
  slotIntervalMinutes: 5,
  customerCancellationEnabled: true,
  cancellationNoticeMinutes: 120,
};

type BookParams = {
  memberId?: string;
  serviceId?: string;
  slug?: string;
};

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { memberId: repeatedMemberId, serviceId: repeatedServiceId, slug } =
    useLocalSearchParams<BookParams>();

  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [favorites, setFavorites] = useState<FavoriteBarbershop[]>([]);
  const [publicShops, setPublicShops] = useState<PublicBarbershop[]>([]);
  const [isStartLoading, setIsStartLoading] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const [shop, setShop] = useState<PublicBarbershopDetail | null>(null);
  const [barbers, setBarbers] = useState<BookableBarber[]>([]);
  const [settings, setSettings] = useState<BookingSettings>(defaultBookingSettings);
  const [activeStep, setActiveStep] = useState<BookingStep>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(slug));
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  const loadStartData = useCallback(async () => {
    if (!token) return;

    setIsStartLoading(true);
    setStartError(null);

    try {
      const [nextAppointments, nextFavorites, nextShops] = await Promise.all([
        getMyAppointments(token),
        getFavoriteBarbershops(token),
        getPublicBarbershops(),
      ]);
      setAppointments(nextAppointments);
      setFavorites(nextFavorites);
      setPublicShops(nextShops);
    } catch (reason: unknown) {
      setStartError(reason instanceof Error ? reason.message : 'Randevu başlangıcı yüklenemedi.');
    } finally {
      setIsStartLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!slug) void loadStartData();
    }, [loadStartData, slug]),
  );

  const lastCompletedAppointment = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.status === 'COMPLETED')
        .sort((first, second) => second.startsAt.localeCompare(first.startsAt))[0] ?? null,
    [appointments],
  );
  const lastShop = useMemo(
    () =>
      publicShops.find((barbershop) => barbershop.id === lastCompletedAppointment?.barbershop.id) ??
      null,
    [lastCompletedAppointment, publicShops],
  );
  const dateOptions = useMemo(
    () => buildDateOptions(settings.maxBookingAdvanceDays),
    [settings.maxBookingAdvanceDays],
  );
  const selectedService = shop?.services.find((service) => service.id === selectedServiceId) ?? null;
  const compatibleBarbers = useMemo(
    () =>
      selectedServiceId
        ? barbers.filter((barber) =>
            barber.serviceAssignments.some(({ service }) => service.id === selectedServiceId),
          )
        : [],
    [barbers, selectedServiceId],
  );
  const selectedBarber = barbers.find((barber) => barber.id === selectedMemberId) ?? null;

  useEffect(() => {
    if (!slug) return;

    const requestId = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);
        setShop(null);
        setSelectedServiceId(null);
        setSelectedMemberId(null);
        setSelectedDate(toDateKey(new Date()));
        setSlots([]);
        setSelectedHour(null);
        setSelectedSlot(null);
        setSlotError(null);

        try {
          const nextShop = await getPublicBarbershop(slug);
          const [nextBarbers, nextSettings] = await Promise.all([
            getBookableBarbers(nextShop.id),
            getBookingSettings(nextShop.id),
          ]);
          setShop(nextShop);
          setBarbers(nextBarbers);
          setSettings(nextSettings);

          const repeatService = nextShop.services.find(({ id }) => id === repeatedServiceId);
          const repeatBarber = nextBarbers.find(
            (barber) =>
              barber.id === repeatedMemberId &&
              barber.serviceAssignments.some(({ service }) => service.id === repeatService?.id),
          );

          if (repeatService && repeatBarber) {
            setSelectedServiceId(repeatService.id);
            setSelectedMemberId(repeatBarber.id);
            setActiveStep(3);
          } else {
            setActiveStep(1);
          }
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : 'Randevu bilgileri yüklenemedi.');
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => clearTimeout(requestId);
  }, [repeatedMemberId, repeatedServiceId, slug]);

  useEffect(() => {
    if (!shop || !selectedServiceId || !selectedMemberId || !selectedDate) return;

    const requestId = setTimeout(() => {
      void (async () => {
        setIsLoadingSlots(true);
        setSlotError(null);
        setSlots([]);
        setSelectedHour(null);
        setSelectedSlot(null);

        try {
          const result = await getAvailability(
            shop.id,
            selectedMemberId,
            selectedServiceId,
            selectedDate,
          );
          setSlots(result.slots);
        } catch (loadError) {
          setSlotError(loadError instanceof Error ? loadError.message : 'Uygun saatler yüklenemedi.');
        } finally {
          setIsLoadingSlots(false);
        }
      })();
    }, 0);

    return () => clearTimeout(requestId);
  }, [selectedDate, selectedMemberId, selectedServiceId, shop]);

  function openShop(nextSlug: string, repeatAppointment?: CustomerAppointment) {
    router.push({
      pathname: '/book',
      params: {
        slug: nextSlug,
        ...(repeatAppointment
          ? {
              memberId: repeatAppointment.businessMember.id,
              serviceId: repeatAppointment.serviceId,
            }
          : {}),
      },
    });
  }

  function selectService(serviceId: string) {
    setSelectedServiceId(serviceId);
    setSelectedMemberId(null);
    resetTimeSelection();
  }

  function selectBarber(memberId: string) {
    setSelectedMemberId(memberId);
    resetTimeSelection();
  }

  function selectDate(date: string) {
    setSelectedDate(date);
    resetTimeSelection();
  }

  function resetTimeSelection() {
    setSlots([]);
    setSelectedHour(null);
    setSelectedSlot(null);
    setSlotError(null);
  }

  function closeFlow() {
    if (slug) router.replace('/book');
    else router.replace('/');
  }

  function goBackStep() {
    if (activeStep === 1) {
      router.replace('/book');
      return;
    }

    setActiveStep((activeStep - 1) as BookingStep);
  }

  function continueFlow() {
    if (activeStep === 1 && selectedService) {
      setActiveStep(2);
      return;
    }

    if (activeStep === 2 && selectedBarber) {
      setActiveStep(3);
      return;
    }

    if (activeStep !== 3 || !shop || !selectedService || !selectedBarber || !selectedSlot) return;

    router.push({
      pathname: '/appointments/preview',
      params: {
        barberName: `${selectedBarber.user.firstName} ${selectedBarber.user.lastName}`,
        barbershopId: shop.id,
        date: selectedDate,
        durationMinutes: String(selectedService.durationMinutes),
        memberId: selectedBarber.id,
        price: selectedService.price,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        shopName: shop.name,
        startsAt: selectedSlot.startsAt,
        time: selectedSlot.startTime,
      },
    });
  }

  if (!slug) {
    return (
      <Screen>
        <BookingFlowHeader onClose={closeFlow} />
        <BookingStartScreen
          error={startError}
          favorites={favorites}
          isLoading={isStartLoading}
          lastAppointment={lastCompletedAppointment}
          lastShop={lastShop}
          onAllFavoritesPress={() => router.push('/favorites')}
          onFavoritePress={(favoriteSlug) => openShop(favoriteSlug)}
          onLastContinue={() => {
            if (lastCompletedAppointment) openShop(lastCompletedAppointment.barbershop.slug);
          }}
          onRepeat={() => {
            if (lastCompletedAppointment) {
              openShop(lastCompletedAppointment.barbershop.slug, lastCompletedAppointment);
            }
          }}
          onRetry={() => void loadStartData()}
          onSearchPress={() => router.push('/barbers')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <BookingFlowHeader activeStep={activeStep} onClose={closeFlow} />

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.emptyState}>
          <AppText color="danger" style={styles.centerText} variant="heading">Bilgiler yüklenemedi</AppText>
          <AppText color="textMuted" style={styles.emptyDescription}>{error}</AppText>
          <View style={styles.errorButton}>
            <AppButton onPress={() => router.replace('/book')} variant="secondary">
              İşletme Seçimine Dön
            </AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && shop ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BookingShopSummary shop={shop} />

          {activeStep === 1 ? (
            <View style={styles.section}>
              <SectionIntro
                description="Randevunun süresi ve fiyatı seçtiğin hizmete göre belirlenir."
                title="Hizmetini seç"
              />
              <AppCard style={styles.serviceList}>
                {shop.services.map((service, index) => (
                  <BookingServiceCard
                    isSelected={selectedServiceId === service.id}
                    key={service.id}
                    onPress={() => selectService(service.id)}
                    service={service}
                    showDivider={index < shop.services.length - 1}
                  />
                ))}
              </AppCard>
            </View>
          ) : null}

          {activeStep === 2 ? (
            <View style={styles.section}>
              <SectionIntro
                description={`${selectedService?.name ?? 'Bu hizmet'} için uygun çalışanlardan birini seç.`}
                title="Çalışanını seç"
              />
              {compatibleBarbers.length ? (
                compatibleBarbers.map((barber) => (
                  <BookingBarberCard
                    barber={barber}
                    isSelected={selectedMemberId === barber.id}
                    key={barber.id}
                    onPress={() => selectBarber(barber.id)}
                  />
                ))
              ) : (
                <AppText color="textMuted">Bu hizmeti veren uygun bir çalışan bulunamadı.</AppText>
              )}
            </View>
          ) : null}

          {activeStep === 3 ? (
            <View style={styles.section}>
              <SectionIntro
                description="Önce günü, ardından açılan saat grubundan sana uygun zamanı seç."
                title="Tarih ve saatini seç"
              />
              <BookingDatePicker
                dates={dateOptions}
                onSelect={selectDate}
                selectedDate={selectedDate}
              />
              <AppText style={styles.timeTitle} variant="heading">Saat Seç</AppText>
              {isLoadingSlots ? <ActivityIndicator color={colors.primary} /> : null}
              {!isLoadingSlots && slotError ? <AppText color="danger">{slotError}</AppText> : null}
              {!isLoadingSlots && !slotError ? (
                <BookingTimePicker
                  onHourSelect={(hour) => {
                    setSelectedHour(hour);
                    setSelectedSlot(null);
                  }}
                  onSlotSelect={setSelectedSlot}
                  selectedHour={selectedHour}
                  selectedStartsAt={selectedSlot?.startsAt ?? null}
                  slots={slots}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.navigationButtons}>
            <View style={styles.navigationButton}>
              <AppButton onPress={goBackStep} variant="secondary">Geri</AppButton>
            </View>
            <View style={styles.navigationButton}>
              <AppButton
                disabled={
                  (activeStep === 1 && !selectedService) ||
                  (activeStep === 2 && !selectedBarber) ||
                  (activeStep === 3 && !selectedSlot)
                }
                onPress={continueFlow}>
                {activeStep === 3 ? 'Randevuyu Kontrol Et' : 'Devam Et'}
              </AppButton>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function SectionIntro({ description, title }: { description: string; title: string }) {
  return (
    <View style={styles.sectionIntro}>
      <AppText style={styles.sectionTitle} variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.sectionDescription} variant="bodySmall">
        {description}
      </AppText>
    </View>
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateOptions(maxBookingAdvanceDays: number): BookingDateOption[] {
  const dayFormatter = new Intl.DateTimeFormat('tr-TR', { weekday: 'short' });
  const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'short' });

  return Array.from({ length: maxBookingAdvanceDays + 1 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);

    return {
      date: toDateKey(date),
      dayLabel: dayFormatter.format(date).replace('.', ''),
      dayNumber: String(date.getDate()),
      monthLabel: monthFormatter.format(date).replace('.', ''),
    };
  });
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  centerText: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.sm, maxWidth: 320, textAlign: 'center' },
  errorButton: { marginTop: spacing.xl, minWidth: 220 },
  content: { paddingBottom: 112, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  section: { marginTop: spacing.xl },
  sectionIntro: { marginBottom: spacing.sm },
  sectionTitle: { fontFamily: fontFamily.display, fontSize: 22, lineHeight: 28 },
  sectionDescription: { lineHeight: 18, marginTop: spacing.xxs },
  serviceList: { padding: 0 },
  timeTitle: {
    fontFamily: fontFamily.display,
    fontSize: 19,
    lineHeight: 25,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  navigationButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl },
  navigationButton: { flex: 1 },
});
