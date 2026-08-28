import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { BookingBarberCard } from '@/features/appointments/components/BookingBarberCard';
import {
  BookingDatePicker,
  type BookingDateOption,
} from '@/features/appointments/components/BookingDatePicker';
import { BookingServiceCard } from '@/features/appointments/components/BookingServiceCard';
import { BookingShopSummary } from '@/features/appointments/components/BookingShopSummary';
import { BookingTimePicker } from '@/features/appointments/components/BookingTimePicker';
import {
  getAvailability,
  getBookableBarbers,
  getBookingSettings,
  getPublicBarbershop,
} from '@/features/barbershops/api';
import type {
  AvailabilitySlot,
  BookableBarber,
  BookingSettings,
  PublicBarbershopDetail,
} from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const defaultBookingSettings: BookingSettings = {
  minBookingNoticeMinutes: 60,
  maxBookingAdvanceDays: 14,
  slotIntervalMinutes: 5,
};

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { memberId: preferredMemberId, slug } = useLocalSearchParams<{
    memberId?: string;
    slug?: string;
  }>();
  const [shop, setShop] = useState<PublicBarbershopDetail | null>(null);
  const [barbers, setBarbers] = useState<BookableBarber[]>([]);
  const [settings, setSettings] = useState<BookingSettings>(defaultBookingSettings);
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

  const dateOptions = useMemo(
    () => buildDateOptions(settings.maxBookingAdvanceDays),
    [settings.maxBookingAdvanceDays],
  );
  const preferredBarber = useMemo(
    () => barbers.find((barber) => barber.id === preferredMemberId) ?? null,
    [barbers, preferredMemberId],
  );
  const visibleServices = useMemo(
    () =>
      preferredBarber
        ? (shop?.services.filter((service) =>
            preferredBarber.serviceAssignments.some(
              ({ service: assignedService }) => assignedService.id === service.id,
            ),
          ) ?? [])
        : (shop?.services ?? []),
    [preferredBarber, shop],
  );
  const selectedService = shop?.services.find((service) => service.id === selectedServiceId) ?? null;
  const compatibleBarbers = useMemo(
    () => {
      if (!selectedServiceId) return [];

      const eligibleBarbers = barbers.filter((barber) =>
        barber.serviceAssignments.some(({ service }) => service.id === selectedServiceId),
      );

      return preferredBarber
        ? eligibleBarbers.filter((barber) => barber.id === preferredBarber.id)
        : eligibleBarbers;
    },
    [barbers, preferredBarber, selectedServiceId],
  );
  const selectedBarber = barbers.find((barber) => barber.id === selectedMemberId) ?? null;

  useEffect(() => {
    if (!slug) return;

    const requestId = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);

        try {
          const nextShop = await getPublicBarbershop(slug);
          const [nextBarbers, nextSettings] = await Promise.all([
            getBookableBarbers(nextShop.id),
            getBookingSettings(nextShop.id),
          ]);
          setShop(nextShop);
          setBarbers(nextBarbers);
          setSettings(nextSettings);
        } catch (loadError) {
          setError(loadError instanceof Error ? loadError.message : 'Randevu bilgileri yüklenemedi.');
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => clearTimeout(requestId);
  }, [slug]);

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
          setSelectedHour(null);
        } catch (loadError) {
          setSlotError(loadError instanceof Error ? loadError.message : 'Uygun saatler yüklenemedi.');
        } finally {
          setIsLoadingSlots(false);
        }
      })();
    }, 0);

    return () => clearTimeout(requestId);
  }, [selectedDate, selectedMemberId, selectedServiceId, shop]);

  function selectService(serviceId: string) {
    setSelectedServiceId(serviceId);
    const preferredBarberSupportsService = preferredBarber?.serviceAssignments.some(
      ({ service }) => service.id === serviceId,
    );
    setSelectedMemberId(
      preferredBarber && preferredBarberSupportsService ? preferredBarber.id : null,
    );
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

  if (!slug) {
    return (
      <Screen>
        <View style={styles.emptyState}>
          <AppText style={styles.centerText} variant="displayMedium">Önce işletmeni seç</AppText>
          <AppText color="textMuted" style={styles.emptyDescription}>
            Hizmetleri ve uygun berberleri görmek için bir berber dükkânı seçmelisin.
          </AppText>
          <View style={styles.emptyButton}>
            <AppButton onPress={() => router.push('/barbers')}>Berberleri Keşfet</AppButton>
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <AppIconButton
          accessibilityLabel="Geri dön"
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          onPress={() => router.back()}
        />
        <AppText variant="heading">Randevu Al</AppText>
        <View style={styles.topBarSpacer} />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.emptyState}>
          <AppText color="danger" style={styles.centerText} variant="heading">Bilgiler yüklenemedi</AppText>
          <AppText color="textMuted" style={styles.emptyDescription}>{error}</AppText>
        </View>
      ) : null}

      {!isLoading && shop ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <BookingShopSummary shop={shop} />

          <View style={styles.section}>
            <SectionTitle title="Hizmet Seç" />
            <AppCard style={styles.serviceList}>
              {visibleServices.map((service, index) => (
                <BookingServiceCard
                  isSelected={selectedServiceId === service.id}
                  key={service.id}
                  onPress={() => selectService(service.id)}
                  service={service}
                  showDivider={index < visibleServices.length - 1}
                />
              ))}
            </AppCard>
          </View>

          {selectedServiceId ? (
            <View style={styles.section}>
              <SectionTitle title="Berber Seç" />
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
                <AppText color="textMuted">Bu hizmeti veren uygun bir berber bulunamadı.</AppText>
              )}
            </View>
          ) : null}

          {selectedMemberId ? (
            <View style={styles.section}>
              <SectionTitle title="Tarih Seç" />
              <BookingDatePicker
                dates={dateOptions}
                onSelect={selectDate}
                selectedDate={selectedDate}
              />
            </View>
          ) : null}

          {selectedMemberId ? (
            <View style={styles.section}>
              <SectionTitle title="Saat Seç" />
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

          <View style={styles.continueButton}>
            <AppButton
              disabled={!selectedService || !selectedBarber || !selectedSlot}
              onPress={() =>
                router.push({
                  pathname: '/appointments/preview',
                  params: {
                    barberName: selectedBarber
                      ? `${selectedBarber.user.firstName} ${selectedBarber.user.lastName}`
                      : '',
                    barbershopId: shop.id,
                    date: selectedDate,
                    memberId: selectedBarber?.id ?? '',
                    serviceId: selectedService?.id ?? '',
                    serviceName: selectedService?.name ?? '',
                    shopName: shop.name,
                    startsAt: selectedSlot?.startsAt ?? '',
                    time: selectedSlot?.startTime ?? '',
                  },
                })
              }>
              Randevuyu Önizle
            </AppButton>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <AppText style={styles.sectionTitle} variant="heading">{title}</AppText>
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  topBarSpacer: { width: 44 },
  loader: { marginTop: spacing.xxxl },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xl },
  centerText: { textAlign: 'center' },
  emptyDescription: { marginTop: spacing.sm, maxWidth: 320, textAlign: 'center' },
  emptyButton: { marginTop: spacing.xl, minWidth: 220 },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  serviceList: { padding: 0 },
  continueButton: { marginTop: spacing.xl },
});
