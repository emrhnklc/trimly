import { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { BookingBarberCard } from '@/features/appointments/components/BookingBarberCard';
import {
  BookingDatePicker,
  type BookingDateOption,
} from '@/features/appointments/components/BookingDatePicker';
import { BookingServiceCard } from '@/features/appointments/components/BookingServiceCard';
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

const defaultBookingSettings: BookingSettings = {
  minBookingNoticeMinutes: 60,
  maxBookingAdvanceDays: 14,
  slotIntervalMinutes: 5,
};

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug?: string }>();
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
          setSelectedHour(result.slots[0]?.startTime.slice(0, 2) ?? null);
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
          <AppText variant="displayMedium">{shop.name}</AppText>
          <AppText color="textMuted" style={styles.subtitle}>
            Seçimini sırayla tamamla; yalnız gerçekten uygun saatleri göstereceğiz.
          </AppText>

          <View style={styles.section}>
            <StepTitle number="1" title="Hizmet seç" />
            {shop.services.map((service) => (
              <BookingServiceCard
                isSelected={selectedServiceId === service.id}
                key={service.id}
                onPress={() => selectService(service.id)}
                service={service}
              />
            ))}
          </View>

          {selectedServiceId ? (
            <View style={styles.section}>
              <StepTitle number="2" title="Berber seç" />
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
              <StepTitle number="3" title="Tarih seç" />
              <BookingDatePicker
                dates={dateOptions}
                onSelect={selectDate}
                selectedDate={selectedDate}
              />
            </View>
          ) : null}

          {selectedMemberId ? (
            <View style={styles.section}>
              <StepTitle number="4" title="Saat seç" />
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

function StepTitle({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.stepTitle}>
      <View style={styles.stepNumber}>
        <AppText color="onPrimary" variant="label">{number}</AppText>
      </View>
      <AppText variant="heading">{title}</AppText>
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
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  subtitle: { marginTop: spacing.xs },
  section: { marginTop: spacing.xxl },
  stepTitle: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.sm },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginRight: spacing.xs,
    width: 28,
  },
  continueButton: { marginTop: spacing.xxl },
});
