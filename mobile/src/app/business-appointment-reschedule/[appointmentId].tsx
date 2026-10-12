import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import {
  getBusinessAppointment,
  rescheduleBusinessAppointment,
} from "@/features/appointments/api";
import { BookingTimePicker } from "@/features/appointments/components/BookingTimePicker";
import type { BusinessAppointmentDetail } from "@/features/appointments/types";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  getActiveServices,
  getAvailability,
  getBookableBarbers,
} from "@/features/barbershops/api";
import type {
  AvailabilitySlot,
  BookableBarber,
  PublicService,
} from "@/features/barbershops/types";
import { useBusiness } from "@/features/business/BusinessProvider";
import { getDateKey } from "@/features/business-appointments/date";
import { DatePickerModal } from "@/features/business-hours/components/DatePickerModal";
import { formatDateKey } from "@/features/business-hours/date";
import { BusinessDetailHeader } from "@/features/business/components/BusinessDetailHeader";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

const changeReasons = [
  "Çalışan programı değişti",
  "Randevu saati uygun değil",
  "Hizmet planı değişti",
  "Müşteri talebi",
] as const;

export default function BusinessAppointmentRescheduleScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [appointment, setAppointment] =
    useState<BusinessAppointmentDetail | null>(null);
  const [date, setDate] = useState("");
  const [services, setServices] = useState<PublicService[]>([]);
  const [members, setMembers] = useState<BookableBarber[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [isLoadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeZone = activeMembership?.barbershop.timezone ?? "Europe/Istanbul";
  const today = getDateKey(new Date(), timeZone);

  const loadSlots = useCallback(
    async (
      nextAppointment: BusinessAppointmentDetail,
      nextDate: string,
      memberId: string,
      serviceId: string,
    ) => {
      setLoadingSlots(true);
      setError(null);
      setSelectedHour(null);
      setSelectedSlot(null);

      try {
        if (!token) throw new Error("Oturum bilgisi bulunamadı.");

        const result = await getAvailability(
          nextAppointment.barbershop.id,
          memberId,
          serviceId,
          nextDate,
          token,
        );
        setSlots(result.slots);
      } catch (reason) {
        setSlots([]);
        setError(
          reason instanceof Error
            ? reason.message
            : "Uygun saatler yüklenemedi.",
        );
      } finally {
        setLoadingSlots(false);
      }
    },
    [token],
  );

  const loadAppointment = useCallback(async () => {
    if (!appointmentId || !activeMembership || !token) {
      setError("Randevu bağlantısı geçersiz.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [result, serviceResult, memberResult] = await Promise.all([
        getBusinessAppointment(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        ),
        getActiveServices(activeMembership.barbershop.id, token),
        getBookableBarbers(activeMembership.barbershop.id, token),
      ]);
      const appointmentDate = getDateKey(
        new Date(result.startsAt),
        result.barbershop.timezone,
      );
      const initialDate = appointmentDate < today ? today : appointmentDate;
      setAppointment(result);
      setServices(serviceResult);
      setMembers(memberResult);
      setSelectedServiceId(result.serviceId);
      setSelectedMemberId(result.businessMember.id);
      setDate(initialDate);
      await loadSlots(
        result,
        initialDate,
        result.businessMember.id,
        result.serviceId,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Randevu bilgileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, [activeMembership, appointmentId, loadSlots, today, token]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  async function submit() {
    const trimmedReason = reason.trim();
    if (
      !appointment ||
      !appointmentId ||
      !token ||
      !selectedSlot ||
      trimmedReason.length < 3
    )
      return;

    setSubmitting(true);
    setError(null);
    try {
      await rescheduleBusinessAppointment(
        appointment.barbershop.id,
        appointmentId,
        selectedSlot.startsAt,
        token,
        trimmedReason,
        selectedMemberId,
        selectedServiceId,
      );
      Alert.alert(
        "Teklif gönderildi",
        "Randevu, müşteri kabul edene kadar eski tarihinde kalacak.",
        [{ onPress: () => router.back(), text: "Tamam" }],
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Değişiklik teklifi gönderilemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader
          onBack={() => router.back()}
          title="Değişiklik Teklifi"
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}

      {!isLoading && appointment ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppCard style={styles.summaryCard}>
            <AppText color="textMuted" variant="bodySmall">
              Randevu
            </AppText>
            <AppText style={styles.customerName} variant="heading">
              {appointment.attendeeNameSnapshot}
            </AppText>
            <AppText
              color="textMuted"
              style={styles.serviceName}
              variant="bodySmall"
            >
              {appointment.serviceNameSnapshot} · {appointment.durationMinutes}{" "}
              dk
            </AppText>
            <AppText
              color="textMuted"
              style={styles.proposalNote}
              variant="bodySmall"
            >
              Seçtiğin yeni saat müşteriye teklif edilir; kabul edilene kadar
              mevcut randevu korunur.
            </AppText>
          </AppCard>

          <AppText style={styles.sectionTitle} variant="heading">
            Hizmet
          </AppText>
          <ScrollView
            contentContainerStyle={styles.choiceList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {services.map((service) => {
              const selected = service.id === selectedServiceId;
              return (
                <Pressable
                  key={service.id}
                  onPress={() => {
                    const compatibleMembers = members.filter((member) =>
                      member.serviceAssignments.some(
                        (assignment) => assignment.service.id === service.id,
                      ),
                    );
                    const nextMemberId = compatibleMembers.some(
                      (member) => member.id === selectedMemberId,
                    )
                      ? selectedMemberId
                      : (compatibleMembers[0]?.id ?? "");
                    setSelectedServiceId(service.id);
                    setSelectedMemberId(nextMemberId);
                    if (nextMemberId) {
                      void loadSlots(
                        appointment,
                        date,
                        nextMemberId,
                        service.id,
                      );
                    } else {
                      setSlots([]);
                      setError(
                        "Bu hizmete atanmış randevuya açık çalışan yok.",
                      );
                    }
                  }}
                  style={({ pressed }) => [
                    styles.choiceChip,
                    {
                      backgroundColor: selected
                        ? themeColors.primary
                        : themeColors.surface,
                      borderColor: selected
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    color={selected ? "onPrimary" : "text"}
                    variant="label"
                  >
                    {service.name} · ₺{service.price}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>

          <AppText style={styles.sectionTitle} variant="heading">
            Çalışan
          </AppText>
          <ScrollView
            contentContainerStyle={styles.choiceList}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {members
              .filter((member) =>
                member.serviceAssignments.some(
                  (assignment) => assignment.service.id === selectedServiceId,
                ),
              )
              .map((member) => {
                const selected = member.id === selectedMemberId;
                return (
                  <Pressable
                    key={member.id}
                    onPress={() => {
                      setSelectedMemberId(member.id);
                      void loadSlots(
                        appointment,
                        date,
                        member.id,
                        selectedServiceId,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.choiceChip,
                      {
                        backgroundColor: selected
                          ? themeColors.primary
                          : themeColors.surface,
                        borderColor: selected
                          ? themeColors.primary
                          : themeColors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppText
                      color={selected ? "onPrimary" : "text"}
                      variant="label"
                    >
                      {member.user.firstName} {member.user.lastName}
                    </AppText>
                  </Pressable>
                );
              })}
          </ScrollView>

          <AppText style={styles.sectionTitle} variant="heading">
            Yeni tarih
          </AppText>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowDatePicker(true)}
            style={({ pressed }) => [
              styles.dateButton,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <SymbolView
              name={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              size={19}
              tintColor={colors.primary}
            />
            <AppText style={styles.dateLabel} variant="label">
              {date ? formatDateKey(date) : "Tarih seç"}
            </AppText>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={15}
              tintColor={colors.textMuted}
            />
          </Pressable>

          <AppText style={styles.sectionTitle} variant="heading">
            Yeni saat
          </AppText>
          {isLoadingSlots ? (
            <ActivityIndicator
              color={colors.primary}
              style={styles.slotLoader}
            />
          ) : (
            <BookingTimePicker
              onHourSelect={setSelectedHour}
              onSlotSelect={setSelectedSlot}
              selectedHour={selectedHour}
              selectedStartsAt={selectedSlot?.startsAt ?? null}
              slots={slots}
            />
          )}

          <AppText style={styles.sectionTitle} variant="heading">
            Değişiklik açıklaması
          </AppText>
          <AppText
            color="textMuted"
            style={styles.reasonHelp}
            variant="bodySmall"
          >
            Bu açıklama müşteriye gösterilecek ve teklif geçmişinde saklanacak.
          </AppText>
          <ScrollView
            contentContainerStyle={styles.choiceList}
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            {changeReasons.map((item) => {
              const selected = reason === item;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item}
                  onPress={() => setReason(item)}
                  style={({ pressed }) => [
                    styles.choiceChip,
                    {
                      backgroundColor: selected
                        ? themeColors.primary
                        : themeColors.surface,
                      borderColor: selected
                        ? themeColors.primary
                        : themeColors.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText
                    color={selected ? "onPrimary" : "text"}
                    variant="bodySmall"
                  >
                    {item}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
          <TextInput
            editable={!isSubmitting}
            maxLength={500}
            multiline
            onChangeText={setReason}
            placeholder="Değişikliğin nedenini yaz…"
            placeholderTextColor={themeColors.textMuted}
            style={[
              styles.reasonInput,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
                color: themeColors.text,
              },
            ]}
            textAlignVertical="top"
            value={reason}
          />
          <AppText
            color="textMuted"
            style={styles.reasonCounter}
            variant="bodySmall"
          >
            {reason.length}/500
          </AppText>

          {error ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: themeColors.dangerSurface },
              ]}
            >
              <AppText color="danger" variant="bodySmall">
                {error}
              </AppText>
            </View>
          ) : null}

          <View style={styles.submitButton}>
            <AppButton
              disabled={
                !selectedSlot || reason.trim().length < 3 || isSubmitting
              }
              onPress={() => void submit()}
            >
              {isSubmitting ? "Gönderiliyor…" : "Müşteriye Teklif Gönder"}
            </AppButton>
          </View>
        </ScrollView>
      ) : null}

      {showDatePicker && date ? (
        <DatePickerModal
          label="Yeni randevu tarihi"
          minDate={today}
          onClose={() => setShowDatePicker(false)}
          onSelect={(value) => {
            setDate(value);
            setShowDatePicker(false);
            if (appointment && selectedMemberId && selectedServiceId) {
              void loadSlots(
                appointment,
                value,
                selectedMemberId,
                selectedServiceId,
              );
            }
          }}
          value={date}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  summaryCard: { marginTop: spacing.md, padding: spacing.md },
  customerName: { fontSize: 18, lineHeight: 24, marginTop: 2 },
  serviceName: { marginTop: 3 },
  proposalNote: { lineHeight: 18, marginTop: spacing.sm },
  reasonHelp: { lineHeight: 18, marginBottom: spacing.sm },
  reasonInput: {
    borderRadius: radius.smallCard,
    borderWidth: 1,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.sm,
    minHeight: 96,
    padding: spacing.md,
  },
  reasonCounter: { marginTop: spacing.xxs, textAlign: "right" },
  choiceList: { gap: spacing.xs, paddingRight: spacing.md },
  choiceChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 23,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  dateButton: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  dateLabel: { flex: 1, marginLeft: spacing.sm },
  pressed: { opacity: 0.65 },
  slotLoader: { marginVertical: spacing.lg },
  errorBox: {
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  submitButton: { marginTop: spacing.xl },
});
