import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { FullscreenImageViewer } from "@/components/ui/FullscreenImageViewer";
import { AppIconButton } from "@/components/ui/AppIconButton";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import {
  cancelMyAppointment,
  disputeMyAppointmentNoShow,
  getMyAppointment,
  respondToAppointmentChangeProposal,
} from "@/features/appointments/api";
import type {
  AppointmentStatus,
  CustomerAppointment,
} from "@/features/appointments/types";
import { NoShowDisputeCard } from "@/features/appointments/components/NoShowDisputeCard";
import { BusinessCancellationRecoveryCard } from "@/features/appointments/components/BusinessCancellationRecoveryCard";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  setGuardianPrivatePhotoConsent,
  uploadCustomerHaircutPhoto,
} from "@/features/haircut-history/api";
import { respondToPortfolioRequest } from "@/features/portfolio/api";
import { AppointmentReviewEditor } from "@/features/reviews/components/AppointmentReviewEditor";
import { resolveApiUrl } from "@/lib/api/client";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";
import { useThemeColors } from "@/theme/useThemeColors";

const statusLabels: Record<AppointmentStatus, string> = {
  CONFIRMED: "Onaylandı",
  ARRIVED: "İşlemde",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal edildi",
  NO_SHOW: "Gelinmedi",
};

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const [appointment, setAppointment] = useState<CustomerAppointment | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRespondingToChange, setIsRespondingToChange] = useState(false);
  const [isDisputingNoShow, setIsDisputingNoShow] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUpdatingPhotoConsent, setIsUpdatingPhotoConsent] = useState(false);
  const [isConfirmingPhotoWithdrawal, setIsConfirmingPhotoWithdrawal] = useState(false);
  const [updatingPortfolioId, setUpdatingPortfolioId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!token || !appointmentId) {
      setError("Randevu bağlantısı geçersiz.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setAppointment(await getMyAppointment(appointmentId, token));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Randevu yüklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [appointmentId, token]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadAppointment(), 0);
    return () => clearTimeout(requestId);
  }, [loadAppointment]);

  function requestCancellation() {
    if (!appointment?.canCancel || isCancelling) return;

    Alert.alert(
      "Randevuyu iptal et",
      "Bu işlemden sonra seçtiğin saat yeniden başkalarına açılacak. Emin misin?",
      [
        { style: "cancel", text: "Vazgeç" },
        {
          onPress: () => void cancelAppointment(),
          style: "destructive",
          text: "İptal Et",
        },
      ],
    );
  }

  async function cancelAppointment() {
    if (!token || !appointmentId) return;

    setIsCancelling(true);
    setError(null);

    try {
      await cancelMyAppointment(appointmentId, token);
      await loadAppointment();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Randevu iptal edilemedi.",
      );
    } finally {
      setIsCancelling(false);
    }
  }

  async function disputeNoShow(reason: string) {
    if (!appointmentId || !token || isDisputingNoShow) return;
    setIsDisputingNoShow(true);
    setError(null);
    try {
      await disputeMyAppointmentNoShow(appointmentId, reason, token);
      await loadAppointment();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "İtiraz gönderilemedi.",
      );
    } finally {
      setIsDisputingNoShow(false);
    }
  }

  async function addCustomerPhoto() {
    if (!appointmentId || !token || isUploadingPhoto) return;
    if (appointment?.requiresGuardianPhotoConsent && !appointment.guardianPrivatePhotoConsentAt) {
      setError("Önce bu randevunun çocuk fotoğrafına izin vermelisin.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (result.canceled) return;

    const photo = result.assets[0];
    if (
      photo.mimeType !== "image/jpeg" &&
      photo.mimeType !== "image/png" &&
      photo.mimeType !== "image/webp"
    ) {
      setError("JPEG, PNG veya WebP formatında bir fotoğraf seçmelisin.");
      return;
    }

    setIsUploadingPhoto(true);
    setError(null);
    try {
      await uploadCustomerHaircutPhoto(
        appointmentId,
        { mimeType: photo.mimeType, uri: photo.uri },
        token,
      );
      await loadAppointment();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Fotoğraf yüklenemedi.",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function updateGuardianPhotoConsent(allow: boolean) {
    if (!appointmentId || !token || isUpdatingPhotoConsent) return;
    setIsUpdatingPhotoConsent(true);
    setError(null);
    try {
      await setGuardianPrivatePhotoConsent(appointmentId, allow, token);
      setIsConfirmingPhotoWithdrawal(false);
      await loadAppointment();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Fotoğraf izni güncellenemedi.",
      );
    } finally {
      setIsUpdatingPhotoConsent(false);
    }
  }

  async function respondToChangeProposal(response: "accept" | "reject") {
    if (!appointmentId || !token || isRespondingToChange) return;

    setIsRespondingToChange(true);
    setError(null);
    try {
      await respondToAppointmentChangeProposal(appointmentId, response, token);
      await loadAppointment();
      Alert.alert(
        response === "accept" ? "Değişiklik kabul edildi" : "Teklif reddedildi",
        response === "accept"
          ? "Randevun yeni tarih ve saate taşındı."
          : "Mevcut randevun değişmeden devam ediyor. İstersen bu randevuyu cezasız iptal edebilirsin.",
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Değişiklik teklifi yanıtlanamadı.",
      );
    } finally {
      setIsRespondingToChange(false);
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/appointments");
  }

  async function respondToPortfolio(
    requestId: string,
    action: "approve" | "reject" | "revoke",
  ) {
    if (!token || updatingPortfolioId) return;
    setUpdatingPortfolioId(requestId);
    setError(null);
    try {
      await respondToPortfolioRequest(requestId, action, token);
      await loadAppointment();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Portföy izni güncellenemedi.",
      );
    } finally {
      setUpdatingPortfolioId(null);
    }
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <AppIconButton
          accessibilityLabel="Geri dön"
          icon={{
            ios: "chevron.left",
            android: "arrow_back",
            web: "arrow_back",
          }}
          onPress={goBack}
        />
        <AppText variant="heading">Randevu Detayı</AppText>
        <View style={styles.topBarSpacer} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}

      {!isLoading && error && !appointment ? (
        <View style={styles.errorState}>
          <AppText color="danger" variant="heading">
            Randevu yüklenemedi
          </AppText>
          <AppText color="textMuted" style={styles.centerText}>
            {error}
          </AppText>
          <View style={styles.retryButton}>
            <AppButton
              onPress={() => void loadAppointment()}
              variant="secondary"
            >
              Tekrar Dene
            </AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && appointment ? (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppointmentSummary appointment={appointment} />

          {appointment.status === 'CANCELLED' && appointment.businessCancellation ? (
            <>
              <AppCard style={{ gap: spacing.xs, marginTop: spacing.md }}>
                <AppText variant="label">İşletme iptal etti</AppText>
                <AppText color="textMuted" variant="bodySmall">
                  {appointment.businessCancellation.reason}
                </AppText>
                <AppText color="textMuted" variant="bodySmall">
                  Bu iptal sana ceza olarak yansımaz.
                </AppText>
              </AppCard>
              <BusinessCancellationRecoveryCard appointment={appointment} />
            </>
          ) : null}

          {appointment.noShowCase ? (
            <NoShowDisputeCard
              appointment={appointment}
              isSubmitting={isDisputingNoShow}
              onSubmit={(reason) => void disputeNoShow(reason)}
            />
          ) : null}

          {appointment.changeProposal ? (
            <CustomerChangeProposalCard
              disabled={isRespondingToChange}
              onAccept={() => void respondToChangeProposal("accept")}
              onReject={() => void respondToChangeProposal("reject")}
              proposal={appointment.changeProposal}
            />
          ) : null}

          <AppText style={styles.sectionTitle} variant="heading">
            Randevu Bilgileri
          </AppText>
          <AppCard style={styles.detailCard}>
            <DetailRow
              icon={{ ios: "person.2", android: "group", web: "group" }}
              label="Randevu sahibi"
              value={appointment.attendeeNameSnapshot}
            />
            <DetailRow
              icon={{ ios: "person", android: "person", web: "person" }}
              label="Berber"
              value={`${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`}
            />
            <DetailRow
              icon={{
                ios: "scissors",
                android: "content_cut",
                web: "content_cut",
              }}
              label="Hizmet"
              value={appointment.serviceNameSnapshot}
            />
            <DetailRow
              icon={{
                ios: "hourglass",
                android: "hourglass_bottom",
                web: "hourglass_bottom",
              }}
              label="Süre"
              value={`${appointment.durationMinutes} dk`}
            />
            {appointment.campaignTitleSnapshot ? (
              <DetailRow
                icon={{ ios: "gift.fill", android: "redeem", web: "redeem" }}
                label="Kampanya"
                value={`${appointment.campaignTitleSnapshot}${appointment.campaignBenefitSnapshot ? ` · ${appointment.campaignBenefitSnapshot}` : ""}`}
              />
            ) : null}
            <DetailRow
              icon={{
                ios: "turkishlirasign.circle",
                android: "payments",
                web: "payments",
              }}
              isLast
              label="Fiyat"
              value={`₺${formatPrice(appointment.priceSnapshot)}`}
            />
          </AppCard>

          {appointment.requiresGuardianPhotoConsent ? (
            <AppCard style={styles.guardianPhotoCard}>
              <AppText variant="cardTitle">Çocuğun fotoğraf izni</AppText>
              <AppText color="textMuted" style={styles.guardianPhotoCopy} variant="bodySmall">
                {appointment.guardianPrivatePhotoConsentAt
                  ? "Bu randevunun özel tıraş geçmişine fotoğraf eklenmesine izin verdin. Fotoğraflar herkese açık portföyde ancak ayrıca onay verirsen yayınlanır."
                  : "Fotoğraf izni varsayılan olarak kapalı. İzin verirsen berber tıraş sonucunu yalnız özel geçmişe ekleyebilir; herkese açık yayın için ayrıca onayın gerekir."}
              </AppText>
              {appointment.guardianPrivatePhotoConsentAt ? (
                isConfirmingPhotoWithdrawal ? (
                  <View style={styles.guardianPhotoActions}>
                    <AppText color="danger" variant="bodySmall">
                      İzni geri çekersen bu randevuya ait fotoğraflar ve varsa portföy yayını kalıcı olarak kaldırılır.
                    </AppText>
                    <AppButton
                      disabled={isUpdatingPhotoConsent}
                      onPress={() => void updateGuardianPhotoConsent(false)}
                    >
                      İzni Geri Çek ve Fotoğrafları Kaldır
                    </AppButton>
                    <AppButton onPress={() => setIsConfirmingPhotoWithdrawal(false)} variant="secondary">
                      Vazgeç
                    </AppButton>
                  </View>
                ) : (
                  <AppButton
                    disabled={isUpdatingPhotoConsent}
                    onPress={() => setIsConfirmingPhotoWithdrawal(true)}
                    variant="secondary"
                  >
                    Fotoğraf İznini Geri Çek
                  </AppButton>
                )
              ) : appointment.status === "CONFIRMED" ||
                appointment.status === "ARRIVED" ||
                appointment.status === "COMPLETED" ? (
                <AppButton
                  disabled={isUpdatingPhotoConsent}
                  onPress={() => void updateGuardianPhotoConsent(true)}
                >
                  Özel Fotoğrafa İzin Ver
                </AppButton>
              ) : null}
            </AppCard>
          ) : null}

          {appointment.status === "COMPLETED" && appointment.haircutRecord ? (
            <HaircutRecordSection
              accessToken={token ?? ""}
              canAddPhoto={!appointment.requiresGuardianPhotoConsent || Boolean(appointment.guardianPrivatePhotoConsentAt)}
              isUploadingPhoto={isUploadingPhoto}
              onAddPhoto={() => void addCustomerPhoto()}
              onPortfolioAction={(requestId, action) =>
                void respondToPortfolio(requestId, action)
              }
              record={appointment.haircutRecord}
              updatingPortfolioId={updatingPortfolioId}
            />
          ) : null}

          {appointment.status === "COMPLETED" && token ? (
            <AppointmentReviewEditor
              accessToken={token}
              appointmentId={appointment.id}
              key={`${appointment.review?.updatedAt ?? "new"}:${appointment.review?.photos.map(({ id }) => id).join(",") ?? ""}`}
              onChanged={loadAppointment}
              review={appointment.review ?? null}
            />
          ) : null}

          <AppCard style={styles.policyCard}>
            <SymbolView
              name={{
                ios: "info.circle",
                android: "info_outline",
                web: "info_outline",
              }}
              size={21}
              tintColor={
                appointment.canCancel ? colors.primary : colors.textMuted
              }
            />
            <View style={styles.policyText}>
              <AppText variant="label">İptal Koşulu</AppText>
              <AppText
                color="textMuted"
                style={styles.policyDescription}
                variant="bodySmall"
              >
                {getCancellationMessage(appointment)}
              </AppText>
            </View>
          </AppCard>

          {error ? (
            <View style={styles.inlineError}>
              <AppText color="danger" variant="bodySmall">
                {error}
              </AppText>
            </View>
          ) : null}

          {appointment.canCancel ? (
            <Pressable
              accessibilityRole="button"
              disabled={isCancelling}
              onPress={requestCancellation}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.pressed,
                isCancelling && styles.disabled,
              ]}
            >
              <SymbolView
                name={{
                  ios: "trash",
                  android: "delete_outline",
                  web: "delete_outline",
                }}
                size={18}
                tintColor={colors.danger}
              />
              <AppText color="danger" variant="label">
                {isCancelling ? "İptal ediliyor…" : "Randevuyu İptal Et"}
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function CustomerChangeProposalCard({
  disabled,
  onAccept,
  onReject,
  proposal,
}: {
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
  proposal: NonNullable<CustomerAppointment["changeProposal"]>;
}) {
  const themeColors = useThemeColors();
  const barberName = `${proposal.proposedBusinessMember.user.firstName} ${proposal.proposedBusinessMember.user.lastName}`;

  return (
    <AppCard
      style={[styles.changeProposalCard, { borderColor: themeColors.primary }]}
    >
      <View style={styles.changeProposalTitleRow}>
        <View
          style={[
            styles.changeProposalIcon,
            { backgroundColor: themeColors.surfaceMuted },
          ]}
        >
          <SymbolView
            name={{
              ios: "calendar.badge.clock",
              android: "pending_actions",
              web: "pending_actions",
            }}
            size={22}
            tintColor={themeColors.primary}
          />
        </View>
        <View style={styles.changeProposalTitleCopy}>
          <AppText variant="heading">Değişiklik teklifi</AppText>
          <AppText color="textMuted" variant="bodySmall">
            İşletme randevunda değişiklik öneriyor.
          </AppText>
        </View>
      </View>
      <View
        style={[
          styles.changeProposalDetails,
          { backgroundColor: themeColors.surfaceMuted },
        ]}
      >
        <AppText variant="label">
          {formatDateTime(proposal.proposedStartsAt)}
        </AppText>
        <AppText
          color="textMuted"
          style={styles.changeProposalMeta}
          variant="bodySmall"
        >
          {proposal.proposedServiceName} · {proposal.proposedDurationMinutes} dk
        </AppText>
        <AppText color="textMuted" variant="bodySmall">
          Berber: {barberName}
        </AppText>
        <AppText color="textMuted" variant="bodySmall">
          Fiyat: ₺{formatPrice(proposal.proposedPrice)}
        </AppText>
        <AppText
          color="textMuted"
          style={styles.changeProposalMeta}
          variant="bodySmall"
        >
          Açıklama: {proposal.reason}
        </AppText>
      </View>
      <AppText
        color="textMuted"
        style={styles.changeProposalExpiry}
        variant="bodySmall"
      >
        Son yanıt zamanı: {formatDateTime(proposal.expiresAt)}
      </AppText>
      <View style={styles.changeProposalActions}>
        <View style={styles.changeProposalAction}>
          <AppButton disabled={disabled} onPress={onReject} variant="secondary">
            Reddet
          </AppButton>
        </View>
        <View style={styles.changeProposalAction}>
          <AppButton disabled={disabled} onPress={onAccept}>
            Kabul Et
          </AppButton>
        </View>
      </View>
    </AppCard>
  );
}

function HaircutRecordSection({
  accessToken,
  canAddPhoto,
  isUploadingPhoto,
  onAddPhoto,
  onPortfolioAction,
  record,
  updatingPortfolioId,
}: {
  accessToken: string;
  canAddPhoto: boolean;
  isUploadingPhoto: boolean;
  onAddPhoto: () => void;
  onPortfolioAction: (
    requestId: string,
    action: "approve" | "reject" | "revoke",
  ) => void;
  record: NonNullable<CustomerAppointment["haircutRecord"]>;
  updatingPortfolioId: string | null;
}) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null,
  );
  const fullscreenImages = record.photos.map((photo, index) => ({
    id: photo.id,
    label: `Tıraş sonucu fotoğrafı ${index + 1}`,
    source: {
      headers: { Authorization: `Bearer ${accessToken}` },
      uri: resolveApiUrl(photo.url),
    },
  }));

  return (
    <View>
      <AppText style={styles.sectionTitle} variant="heading">
        Tıraş Sonucu
      </AppText>
      <AppCard style={styles.haircutCard}>
        {record.styleName ? (
          <View style={styles.haircutRow}>
            <View style={styles.haircutIcon}>
              <SymbolView
                name={{
                  ios: "scissors",
                  android: "content_cut",
                  web: "content_cut",
                }}
                size={19}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.haircutCopy}>
              <AppText color="textMuted" variant="bodySmall">
                Stil / model
              </AppText>
              <AppText style={styles.haircutValue} variant="label">
                {record.styleName}
              </AppText>
            </View>
          </View>
        ) : null}

        {record.notes ? (
          <View
            style={[
              styles.haircutRow,
              record.styleName && styles.haircutRowDivider,
            ]}
          >
            <View style={styles.haircutIcon}>
              <SymbolView
                name={{ ios: "note.text", android: "notes", web: "notes" }}
                size={19}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.haircutCopy}>
              <AppText color="textMuted" variant="bodySmall">
                Berber notu
              </AppText>
              <AppText style={styles.haircutNote}>{record.notes}</AppText>
            </View>
          </View>
        ) : null}
      </AppCard>

      {record.photos.length ? (
        <ScrollView
          contentContainerStyle={styles.photoList}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {record.photos.map((photo, index) => (
            <Pressable
              accessibilityLabel={`Tıraş sonucu fotoğrafı ${index + 1}`}
              accessibilityRole="button"
              key={photo.id}
              onPress={() => setSelectedPhotoIndex(index)}
              style={({ pressed }) => [
                styles.haircutPhoto,
                pressed && styles.pressed,
              ]}
            >
              <Image
                contentFit="cover"
                source={fullscreenImages[index].source}
                style={styles.haircutPhotoImage}
                transition={180}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      {record.photos.map((photo) => {
        const publication = photo.portfolioItem;
        if (
          !publication ||
          publication.status === "REJECTED" ||
          publication.status === "REVOKED"
        )
          return null;
        const isUpdating = updatingPortfolioId === publication.id;
        return (
          <AppCard key={publication.id} style={styles.portfolioConsentCard}>
            <View style={styles.portfolioConsentCopy}>
              <AppText variant="label">
                {publication.status === "PENDING"
                  ? "Portföy yayın izni"
                  : "Portföyde yayınlanıyor"}
              </AppText>
              <AppText
                color="textMuted"
                style={styles.portfolioConsentText}
                variant="bodySmall"
              >
                {publication.status === "PENDING"
                  ? "İşletme bu fotoğrafı herkese açık tıraş portföyünde göstermek istiyor."
                  : "Bu fotoğrafı dilediğin zaman herkese açık portföyden kaldırabilirsin."}
              </AppText>
            </View>
            {publication.status === "PENDING" ? (
              <View style={styles.portfolioActions}>
                <AppButton
                  disabled={isUpdating}
                  onPress={() => onPortfolioAction(publication.id, "reject")}
                  variant="secondary"
                >
                  İzin Verme
                </AppButton>
                <AppButton
                  disabled={isUpdating}
                  onPress={() => onPortfolioAction(publication.id, "approve")}
                >
                  Yayınlanabilir
                </AppButton>
              </View>
            ) : (
              <AppButton
                disabled={isUpdating}
                onPress={() => onPortfolioAction(publication.id, "revoke")}
                variant="secondary"
              >
                Yayından Kaldır
              </AppButton>
            )}
          </AppCard>
        );
      })}
      <View style={styles.customerPhotoButton}>
        {canAddPhoto ? (
          <AppButton
            disabled={isUploadingPhoto}
            onPress={onAddPhoto}
            variant="secondary"
          >
            {isUploadingPhoto
              ? "Fotoğraf Yükleniyor…"
              : "Geçmişime Fotoğraf Ekle"}
          </AppButton>
        ) : (
          <AppText color="textMuted" variant="bodySmall">
            Fotoğraf eklemek için yukarıdan izin vermelisin.
          </AppText>
        )}
      </View>
      <FullscreenImageViewer
        images={fullscreenImages}
        initialIndex={selectedPhotoIndex ?? 0}
        onClose={() => setSelectedPhotoIndex(null)}
        visible={selectedPhotoIndex !== null}
      />
    </View>
  );
}

function AppointmentSummary({
  appointment,
}: {
  appointment: CustomerAppointment;
}) {
  const themeColors = useThemeColors();
  const startsAt = new Date(appointment.startsAt);
  const isCancelled = appointment.status === "CANCELLED";
  const isConfirmed = appointment.status === "CONFIRMED";
  const statusBackground = isCancelled
    ? themeColors.dangerSurface
    : isConfirmed
      ? themeColors.successSurface
      : themeColors.surfaceMuted;
  const statusColor = isCancelled
    ? themeColors.danger
    : isConfirmed
      ? themeColors.success
      : themeColors.textMuted;

  return (
    <AppCard style={styles.summaryCard}>
      <View style={styles.dateBox}>
        <AppText color="onPrimary" variant="bodySmall">
          {new Intl.DateTimeFormat("tr-TR", { weekday: "short" })
            .format(startsAt)
            .replace(".", "")}
        </AppText>
        <AppText
          color="onPrimary"
          style={styles.dayNumber}
          variant="displayMedium"
        >
          {new Intl.DateTimeFormat("tr-TR", { day: "2-digit" }).format(
            startsAt,
          )}
        </AppText>
        <AppText color="onPrimary" variant="bodySmall">
          {new Intl.DateTimeFormat("tr-TR", { month: "short" })
            .format(startsAt)
            .replace(".", "")}
        </AppText>
      </View>
      <View style={styles.summaryContent}>
        <AppText variant="displayMedium">{appointment.barbershop.name}</AppText>
        <AppText color="textMuted" style={styles.summaryMeta}>
          {formatDateTime(appointment.startsAt)}
        </AppText>
        <View
          style={[styles.statusBadge, { backgroundColor: statusBackground }]}
        >
          <AppText style={{ color: statusColor }} variant="bodySmall">
            {statusLabels[appointment.status]}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

function DetailRow({
  icon,
  isLast = false,
  label,
  value,
}: {
  icon: SymbolViewProps["name"];
  isLast?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailDivider]}>
      <View style={styles.detailLabel}>
        <SymbolView name={icon} size={17} tintColor={colors.primary} />
        <AppText color="textMuted" variant="bodySmall">
          {label}
        </AppText>
      </View>
      <AppText numberOfLines={2} style={styles.detailValue} variant="label">
        {value}
      </AppText>
    </View>
  );
}

function getCancellationMessage(appointment: CustomerAppointment) {
  if (appointment.cancellationReason) return appointment.cancellationReason;

  const notice = formatNotice(appointment.cancellationNoticeMinutes);
  const deadline = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
  }).format(new Date(appointment.cancellationDeadline));

  return `Randevuyu ${notice} öncesine kadar iptal edebilirsin. Son iptal zamanı: ${deadline}.`;
}

function formatNotice(minutes: number) {
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60} saat`;
  return `${minutes} dakika`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    weekday: "long",
  }).format(new Date(value));
}

function formatPrice(price: string) {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice)
    ? new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(
        numericPrice,
      )
    : price;
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  topBarSpacer: { width: 44 },
  loader: { marginTop: spacing.xxxl },
  errorState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  centerText: { marginTop: spacing.xs, textAlign: "center" },
  retryButton: { marginTop: spacing.xl, minWidth: 180 },
  content: {
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  changeProposalCard: { gap: spacing.md, marginTop: spacing.md },
  changeProposalTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  changeProposalIcon: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  changeProposalTitleCopy: { flex: 1 },
  changeProposalDetails: {
    borderRadius: radius.smallCard,
    gap: 3,
    padding: spacing.sm,
  },
  changeProposalMeta: { marginTop: spacing.xxs },
  changeProposalExpiry: { lineHeight: 18 },
  changeProposalActions: { flexDirection: "row", gap: spacing.xs },
  changeProposalAction: { flex: 1 },
  summaryCard: {
    alignItems: "center",
    flexDirection: "row",
    padding: spacing.sm,
  },
  dateBox: {
    alignItems: "center",
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    justifyContent: "center",
    minHeight: 94,
    width: 72,
  },
  dayNumber: { fontSize: 27, lineHeight: 31 },
  summaryContent: { flex: 1, marginLeft: spacing.md },
  summaryMeta: { marginTop: spacing.xs, textTransform: "capitalize" },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  detailCard: { paddingVertical: spacing.xs },
  guardianPhotoCard: { gap: spacing.sm, marginTop: spacing.lg },
  guardianPhotoCopy: { lineHeight: 20 },
  guardianPhotoActions: { gap: spacing.xs },
  detailRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 50,
    paddingVertical: spacing.xs,
  },
  detailDivider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  detailLabel: { alignItems: "center", flexDirection: "row", gap: spacing.xs },
  detailValue: { flex: 1, marginLeft: spacing.md, textAlign: "right" },
  haircutCard: { paddingVertical: spacing.xs },
  haircutRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    paddingVertical: spacing.sm,
  },
  haircutRowDivider: { borderTopColor: colors.border, borderTopWidth: 1 },
  haircutIcon: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  haircutCopy: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  haircutValue: { marginTop: 2 },
  haircutNote: { lineHeight: 21, marginTop: 2 },
  photoList: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    paddingTop: spacing.sm,
  },
  haircutPhoto: {
    borderRadius: radius.card,
    height: 180,
    overflow: "hidden",
    width: 250,
  },
  haircutPhotoImage: { height: "100%", width: "100%" },
  customerPhotoButton: { marginTop: spacing.sm },
  portfolioConsentCard: { marginTop: spacing.sm },
  portfolioConsentCopy: { marginBottom: spacing.sm },
  portfolioConsentText: { lineHeight: 19, marginTop: 3 },
  portfolioActions: { gap: spacing.xs },
  policyCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: spacing.lg,
  },
  policyText: { flex: 1, marginLeft: spacing.sm },
  policyDescription: { marginTop: spacing.xxs },
  inlineError: {
    backgroundColor: "#F8E8E5",
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  cancelButton: {
    alignItems: "center",
    borderColor: colors.danger,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.xl,
    minHeight: 50,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
