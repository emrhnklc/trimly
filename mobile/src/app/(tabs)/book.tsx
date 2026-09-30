import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { getMyAppointments } from "@/features/appointments/api";
import { BookingBarberCard } from "@/features/appointments/components/BookingBarberCard";
import { BookingAttendeePicker } from "@/features/appointments/components/BookingAttendeePicker";
import {
  BookingDatePicker,
  type BookingDateOption,
} from "@/features/appointments/components/BookingDatePicker";
import { BookingFlowHeader } from "@/features/appointments/components/BookingFlowHeader";
import type { BookingStep } from "@/features/appointments/components/BookingProgress";
import { BookingServiceCard } from "@/features/appointments/components/BookingServiceCard";
import { BookingShopSummary } from "@/features/appointments/components/BookingShopSummary";
import { BookingStartScreen } from "@/features/appointments/components/BookingStartScreen";
import { BookingTimePicker } from "@/features/appointments/components/BookingTimePicker";
import type { CustomerAppointment } from "@/features/appointments/types";
import { useAuth } from "@/features/auth/AuthProvider";
import { getMyDependents } from "@/features/dependents/api";
import type { DependentProfile } from "@/features/dependents/types";
import {
  getActiveServices,
  getAvailability,
  getBookableBarbers,
  getBookingSettings,
  getPublicBarbershop,
  getPublicBarbershops,
  redeemBarbershopAccess,
} from "@/features/barbershops/api";
import { BarbershopAccessCard } from "@/features/barbershops/components/BarbershopAccessCard";
import type {
  AvailabilitySlot,
  BookableBarber,
  BookingSettings,
  PublicBarbershop,
  PublicBarbershopDetail,
  PublicService,
} from "@/features/barbershops/types";
import { getFavoriteBarbershops } from "@/features/favorites/api";
import type { FavoriteBarbershop } from "@/features/favorites/types";
import { getActiveBarbershopCampaigns } from "@/features/campaigns/api";
import { getCampaignPrice, type Campaign } from "@/features/campaigns/types";
import { isApiErrorCode } from "@/lib/api/client";
import { colors } from "@/theme/colors";
import { layout, spacing } from "@/theme/spacing";

const defaultBookingSettings: BookingSettings = {
  minBookingNoticeMinutes: 60,
  maxBookingAdvanceDays: 14,
  slotIntervalMinutes: 5,
  customerCancellationEnabled: true,
  cancellationNoticeMinutes: 120,
};

type BookParams = {
  campaignId?: string;
  memberId?: string;
  serviceId?: string;
  slug?: string;
  attendeeSelected?: string;
  dependentProfileId?: string;
};

type BookingFormStep = 1 | 2 | 3;

export default function BookAppointmentScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const {
    attendeeSelected,
    campaignId,
    dependentProfileId: initialDependentProfileId,
    memberId: repeatedMemberId,
    serviceId: repeatedServiceId,
    slug,
  } = useLocalSearchParams<BookParams>();

  const [dependents, setDependents] = useState<DependentProfile[]>([]);
  const [isDependentsLoading, setDependentsLoading] = useState(true);
  const [selectedDependentId, setSelectedDependentId] = useState<string | null>(
    initialDependentProfileId ?? null,
  );
  const [isAttendeeSelected, setAttendeeSelected] = useState(
    attendeeSelected === "1",
  );

  const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
  const [favorites, setFavorites] = useState<FavoriteBarbershop[]>([]);
  const [publicShops, setPublicShops] = useState<PublicBarbershop[]>([]);
  const [isStartLoading, setIsStartLoading] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const [shop, setShop] = useState<PublicBarbershopDetail | null>(null);
  const [barbers, setBarbers] = useState<BookableBarber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<BookingSettings>(
    defaultBookingSettings,
  );
  const [activeStep, setActiveStep] = useState<BookingFormStep>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(Boolean(slug));
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [requiresAccess, setRequiresAccess] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [isAccessSubmitting, setIsAccessSubmitting] = useState(false);
  const [accessReloadKey, setAccessReloadKey] = useState(0);

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
      setStartError(
        reason instanceof Error
          ? reason.message
          : "Randevu başlangıcı yüklenemedi.",
      );
    } finally {
      setIsStartLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      if (!slug) void loadStartData();
    }, [loadStartData, slug]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let isActive = true;
      setDependentsLoading(true);
      void getMyDependents(token)
        .then((items) => {
          if (!isActive) return;
          setDependents(items);
          setSelectedDependentId((currentDependentId) =>
            currentDependentId &&
            !items.some((item) => item.id === currentDependentId)
              ? null
              : currentDependentId,
          );
        })
        .catch(() => {
          if (isActive) setDependents([]);
        })
        .finally(() => {
          if (isActive) setDependentsLoading(false);
        });
      return () => {
        isActive = false;
      };
    }, [token]),
  );

  const lastCompletedAppointment = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.status === "COMPLETED")
        .sort((first, second) =>
          second.startsAt.localeCompare(first.startsAt),
        )[0] ?? null,
    [appointments],
  );
  const lastShop = useMemo(
    () =>
      publicShops.find(
        (barbershop) =>
          barbershop.id === lastCompletedAppointment?.barbershop.id,
      ) ?? null,
    [lastCompletedAppointment, publicShops],
  );
  const dateOptions = useMemo(
    () => buildDateOptions(settings.maxBookingAdvanceDays),
    [settings.maxBookingAdvanceDays],
  );
  const selectedService =
    shop?.services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedCampaign = campaigns.find((campaign) => campaign.id === campaignId) ?? null;
  const compatibleBarbers = useMemo(
    () =>
      selectedServiceId
        ? barbers.filter((barber) =>
            barber.serviceAssignments.some(
              ({ service }) => service.id === selectedServiceId,
            ),
          )
        : [],
    [barbers, selectedServiceId],
  );
  const selectedBarber =
    barbers.find((barber) => barber.id === selectedMemberId) ?? null;

  useEffect(() => {
    if (!slug) return;

    const requestId = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setError(null);
        setShop(null);
        setSelectedServiceId(null);
        setSelectedMemberId(null);
        setCampaigns([]);
        setSelectedDate(toDateKey(new Date()));
        setSlots([]);
        setSelectedHour(null);
        setSelectedSlot(null);
        setSlotError(null);
        setRequiresAccess(false);
        setAccessError(null);

        try {
          if (!token) throw new Error("Randevu almak için giriş yapmalısın.");

          const nextShop = await getPublicBarbershop(slug);

          if (!nextShop.isBookingOpen) {
            throw new Error(
              'Bu işletme şu anda yeni randevu kabul etmiyor. Daha sonra tekrar deneyebilirsin.',
            );
          }
          setShop(nextShop);

          let nextServices: PublicService[];
          let nextBarbers: BookableBarber[];
          let nextSettings: BookingSettings;
          let nextCampaigns: Campaign[];

          try {
            [nextServices, nextBarbers, nextSettings, nextCampaigns] = await Promise.all([
              getActiveServices(nextShop.id, token),
              getBookableBarbers(nextShop.id, token),
              getBookingSettings(nextShop.id),
              getActiveBarbershopCampaigns(nextShop.id, token),
            ]);
          } catch (reason) {
            if (!isApiErrorCode(reason, "BARBERSHOP_ACCESS_REQUIRED"))
              throw reason;
            setRequiresAccess(true);
            return;
          }

          const bookableShop = { ...nextShop, services: nextServices };
          setShop(bookableShop);
          setBarbers(nextBarbers);
          setSettings(nextSettings);
          setCampaigns(nextCampaigns);

          const repeatService = bookableShop.services.find(
            ({ id }) => id === repeatedServiceId,
          );
          const repeatBarber = nextBarbers.find(
            (barber) =>
              barber.id === repeatedMemberId &&
              barber.serviceAssignments.some(
                ({ service }) => service.id === repeatService?.id,
              ),
          );

          if (repeatService && repeatBarber) {
            setSelectedServiceId(repeatService.id);
            setSelectedMemberId(repeatBarber.id);
            setActiveStep(3);
          } else if (campaignId && repeatService && nextCampaigns.some(({ id }) => id === campaignId)) {
            setSelectedServiceId(repeatService.id);
            setActiveStep(2);
          } else {
            setActiveStep(1);
          }
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Randevu bilgileri yüklenemedi.",
          );
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => clearTimeout(requestId);
  }, [accessReloadKey, campaignId, repeatedMemberId, repeatedServiceId, slug, token]);

  useFocusEffect(
    useCallback(() => {
      if (!shop || !selectedServiceId || !selectedMemberId || !selectedDate)
        return;

      let isActive = true;
      const requestId = setTimeout(() => {
        void (async () => {
          setIsLoadingSlots(true);
          setSlotError(null);
          setSlots([]);
          setSelectedHour(null);
          setSelectedSlot(null);

          try {
            if (!token) throw new Error("Randevu almak için giriş yapmalısın.");

            const result = await getAvailability(
              shop.id,
              selectedMemberId,
              selectedServiceId,
              selectedDate,
              token,
            );
            if (isActive) setSlots(result.slots);
          } catch (loadError) {
            if (!isActive) return;
            setSlotError(
              loadError instanceof Error
                ? loadError.message
                : "Uygun saatler yüklenemedi.",
            );
          } finally {
            if (isActive) setIsLoadingSlots(false);
          }
        })();
      }, 0);

      return () => {
        isActive = false;
        clearTimeout(requestId);
      };
    }, [selectedDate, selectedMemberId, selectedServiceId, shop, token]),
  );

  function openShop(nextSlug: string, repeatAppointment?: CustomerAppointment) {
    router.push({
      pathname: "/book",
      params: {
        slug: nextSlug,
        attendeeSelected: "1",
        ...(selectedDependentId
          ? { dependentProfileId: selectedDependentId }
          : {}),
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
    const preferredBarber = barbers.find(
      (barber) =>
        barber.id === repeatedMemberId &&
        barber.serviceAssignments.some(({ service }) => service.id === serviceId),
    );
    setSelectedMemberId(preferredBarber?.id ?? null);
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

  async function unlockBookingAccess(code: string) {
    if (!shop || !token || isAccessSubmitting) return;

    setIsAccessSubmitting(true);
    setAccessError(null);

    try {
      await redeemBarbershopAccess(shop.slug, code, token);
      setRequiresAccess(false);
      setAccessReloadKey((current) => current + 1);
    } catch (reason) {
      setAccessError(
        reason instanceof Error ? reason.message : "Erişim kodu doğrulanamadı.",
      );
    } finally {
      setIsAccessSubmitting(false);
    }
  }

  function closeFlow() {
    if (slug) router.replace("/book");
    else router.replace("/");
  }

  function goBackStep() {
    if (activeStep === 1) {
      router.replace({
        pathname: "/book",
        params: {
          attendeeSelected: "1",
          ...(selectedDependentId
            ? { dependentProfileId: selectedDependentId }
            : {}),
        },
      });
      return;
    }

    setActiveStep((activeStep - 1) as BookingFormStep);
  }

  function continueFlow() {
    if (!user) return;

    if (activeStep === 1 && selectedService) {
      setActiveStep(2);
      return;
    }

    if (activeStep === 2 && selectedBarber) {
      setActiveStep(3);
      return;
    }

    if (
      activeStep !== 3 ||
      !shop ||
      !selectedService ||
      !selectedBarber ||
      !selectedSlot
    )
      return;

    const selectedDependent = selectedDependentId
      ? dependents.find((item) => item.id === selectedDependentId)
      : null;
    const attendeeName = selectedDependent
      ? `${selectedDependent.firstName} ${selectedDependent.lastName}`
      : `${user.firstName} ${user.lastName}`;

    router.push({
      pathname: "/appointments/preview",
      params: {
        barberName: `${selectedBarber.user.firstName} ${selectedBarber.user.lastName}`,
        barbershopId: shop.id,
        date: selectedDate,
        durationMinutes: String(selectedService.durationMinutes),
        ...(selectedCampaign ? {
          campaignId: selectedCampaign.id,
          campaignBenefit: selectedCampaign.rewardType === "GIFT"
            ? selectedCampaign.giftDescription ?? "Hediye dahil"
            : selectedCampaign.discountType === "PERCENTAGE"
              ? `%${selectedCampaign.discountValue} indirim`
              : `₺${selectedCampaign.discountValue} indirim`,
          campaignTitle: selectedCampaign.title,
          ...(selectedCampaign.rewardType === "DISCOUNT" ? { originalPrice: selectedService.price } : {}),
        } : {}),
        memberId: selectedBarber.id,
        price: String(selectedCampaign ? getCampaignPrice(selectedService.price, selectedCampaign) : selectedService.price),
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        shopName: shop.name,
        startsAt: selectedSlot.startsAt,
        time: selectedSlot.startTime,
        attendeeName,
        ...(selectedDependentId ? { dependentProfileId: selectedDependentId } : {}),
      },
    });
  }

  if (!user) return null;

  if (!isAttendeeSelected) {
    return (
      <Screen>
        <BookingFlowHeader activeStep={1} onClose={closeFlow} />
        <BookingAttendeePicker
          dependents={dependents}
          isLoading={isDependentsLoading}
          onAddDependent={() => router.push("/dependents/new")}
          onContinue={() => setAttendeeSelected(true)}
          onSelect={setSelectedDependentId}
          selectedDependentId={selectedDependentId}
          user={user}
        />
      </Screen>
    );
  }

  if (!slug) {
    return (
      <Screen>
        <BookingFlowHeader
          activeStep={2}
          onBack={() => setAttendeeSelected(false)}
          onClose={closeFlow}
        />
        <BookingStartScreen
          error={startError}
          favorites={favorites}
          isLoading={isStartLoading}
          lastAppointment={lastCompletedAppointment}
          lastShop={lastShop}
          onAllFavoritesPress={() => router.push("/favorites")}
          onFavoritePress={(favoriteSlug) => openShop(favoriteSlug)}
          onRepeat={() => {
            if (lastCompletedAppointment) {
              openShop(
                lastCompletedAppointment.barbershop.slug,
                lastCompletedAppointment,
              );
            }
          }}
          onRetry={() => void loadStartData()}
          onSearchPress={() => router.push("/barbers")}
        />
      </Screen>
    );
  }

  if (!isLoading && shop && requiresAccess) {
    return (
      <Screen>
        <BookingFlowHeader
          activeStep={3}
          onBack={() => router.replace('/book')}
          onClose={closeFlow}
        />
        <ScrollView
          contentContainerStyle={styles.accessContent}
          showsVerticalScrollIndicator={false}
        >
          <BookingShopSummary shop={shop} />
          <BarbershopAccessCard
            barbershopName={shop.name}
            error={accessError}
            isSubmitting={isAccessSubmitting}
            onSubmit={unlockBookingAccess}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <BookingFlowHeader
        activeStep={(activeStep + 2) as BookingStep}
        onBack={goBackStep}
        onClose={closeFlow}
      />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}

      {!isLoading && error ? (
        <View style={styles.emptyState}>
          <AppText color="danger" style={styles.centerText} variant="heading">
            Bilgiler yüklenemedi
          </AppText>
          <AppText color="textMuted" style={styles.emptyDescription}>
            {error}
          </AppText>
          <View style={styles.errorButton}>
            <AppButton
              onPress={() => router.replace("/book")}
              variant="secondary"
            >
              İşletme Seçimine Dön
            </AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && shop ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
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
                description={`${selectedService?.name ?? "Bu hizmet"} için uygun çalışanlardan birini seç.`}
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
                <AppText color="textMuted">
                  Bu hizmeti veren uygun bir çalışan bulunamadı.
                </AppText>
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
              <AppText style={styles.timeTitle} variant="sectionTitle">
                Saat Seç
              </AppText>
              {isLoadingSlots ? (
                <ActivityIndicator color={colors.primary} />
              ) : null}
              {!isLoadingSlots && slotError ? (
                <AppText color="danger">{slotError}</AppText>
              ) : null}
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
              <AppButton onPress={goBackStep} variant="secondary">
                Geri
              </AppButton>
            </View>
            <View style={styles.navigationButton}>
              <AppButton
                disabled={
                  (activeStep === 1 && !selectedService) ||
                  (activeStep === 2 && !selectedBarber) ||
                  (activeStep === 3 && !selectedSlot)
                }
                onPress={continueFlow}
              >
                {activeStep === 3 ? "Randevuyu Kontrol Et" : "Devam Et"}
              </AppButton>
            </View>
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function SectionIntro({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <View style={styles.sectionIntro}>
      <AppText style={styles.sectionTitle} variant="sectionTitle">
        {title}
      </AppText>
      <AppText
        color="textMuted"
        style={styles.sectionDescription}
        variant="bodySmall"
      >
        {description}
      </AppText>
    </View>
  );
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDateOptions(maxBookingAdvanceDays: number): BookingDateOption[] {
  const dayFormatter = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });
  const monthFormatter = new Intl.DateTimeFormat("tr-TR", { month: "short" });

  return Array.from({ length: maxBookingAdvanceDays + 1 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);

    return {
      date: toDateKey(date),
      dayLabel: dayFormatter.format(date).replace(".", ""),
      dayNumber: String(date.getDate()),
      monthLabel: monthFormatter.format(date).replace(".", ""),
    };
  });
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  emptyState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  centerText: { textAlign: "center" },
  emptyDescription: {
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: "center",
  },
  errorButton: { marginTop: spacing.xl, minWidth: 220 },
  content: {
    paddingBottom: 112,
    paddingHorizontal: layout.screenHorizontalPadding,
    paddingTop: spacing.xs,
  },
  accessContent: {
    gap: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  section: { marginTop: layout.sectionGap },
  sectionIntro: { marginBottom: spacing.sm },
  sectionTitle: { fontSize: 22, lineHeight: 28 },
  sectionDescription: { lineHeight: 18, marginTop: spacing.xxs },
  serviceList: { padding: 0 },
  timeTitle: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  navigationButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  navigationButton: { flex: 1 },
});
