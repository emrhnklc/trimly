import { Image } from "expo-image";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import type {
  AppointmentStatus,
  BusinessAppointmentDetail,
} from "@/features/appointments/types";
import { formatBusinessTime } from "@/features/business-appointments/date";
import { formatTurkishPrice } from "@/features/business-management/format";
import { resolveApiUrl } from "@/lib/api/client";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const statusConfig: Record<
  AppointmentStatus,
  { color: string; label: string }
> = {
  CONFIRMED: { color: "#5E8B61", label: "Onaylandı" },
  ARRIVED: { color: colors.primary, label: "İşlemde" },
  COMPLETED: { color: "#4F7653", label: "Tamamlandı" },
  CANCELLED: { color: colors.danger, label: "İptal edildi" },
  NO_SHOW: { color: "#9B6B3D", label: "Gelmedi" },
};

type BusinessAppointmentDetailContentProps = {
  appointment: BusinessAppointmentDetail;
  accessToken: string;
  canOpenCustomer: boolean;
  isUpdating: boolean;
  onCancel: () => void;
  onCancelChangeProposal: () => void;
  onNoShow: () => void;
  onOpenCustomer: () => void;
  onOpenHaircutRecord: () => void;
  onRequestPortfolio: (photoId: string) => void;
  onReschedule: () => void;
};

export function BusinessAppointmentDetailContent({
  appointment,
  accessToken,
  canOpenCustomer,
  isUpdating,
  onCancel,
  onCancelChangeProposal,
  onNoShow,
  onOpenCustomer,
  onOpenHaircutRecord,
  onRequestPortfolio,
  onReschedule,
}: BusinessAppointmentDetailContentProps) {
  const customerName = appointment.attendeeNameSnapshot;
  const barberName = `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`;
  const nameParts = customerName.trim().split(/\s+/);
  const initials = `${nameParts[0]?.[0] ?? ""}${nameParts.at(-1)?.[0] ?? ""}`;
  const status = statusConfig[appointment.status];
  const date = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "full",
    timeZone: appointment.barbershop.timezone,
  }).format(new Date(appointment.startsAt));
  const canManage =
    appointment.status === "CONFIRMED" || appointment.status === "ARRIVED";
  const canReschedule =
    appointment.status === "CONFIRMED" && !appointment.changeProposal;
  const canMarkNoShow =
    appointment.status === "CONFIRMED" &&
    new Date() >=
      new Date(new Date(appointment.startsAt).getTime() + 15 * 60 * 1000);
  const canComplete =
    (appointment.status === "CONFIRMED" || appointment.status === "ARRIVED") &&
    new Date() >= new Date(appointment.startsAt);
  const canEditRecord =
    appointment.status === "COMPLETED" &&
    (!appointment.haircutRecord || !appointment.haircutRecord.finalizedAt);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityLabel={
          canOpenCustomer ? `${customerName} müşteri detayını aç` : undefined
        }
        accessibilityRole={canOpenCustomer ? "button" : undefined}
        disabled={!canOpenCustomer}
        onPress={canOpenCustomer ? onOpenCustomer : undefined}
        style={({ pressed }) => canOpenCustomer && pressed && styles.pressed}
      >
        <AppCard style={styles.customerCard}>
          <View style={styles.customerTopRow}>
            {!appointment.dependentProfileId &&
            appointment.customer.profileImageUrl ? (
              <Image
                accessibilityLabel={`${customerName} profil fotoğrafı`}
                contentFit="cover"
                source={appointment.customer.profileImageUrl}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <AppText
                  color="primary"
                  style={styles.initials}
                  variant="heading"
                >
                  {initials}
                </AppText>
              </View>
            )}
            <View style={styles.customerCopy}>
              <AppText style={styles.customerName} variant="heading">
                {customerName}
              </AppText>
              <AppText color="textMuted" variant="bodySmall">
                {appointment.completedVisitCount} tamamlanmış ziyaret
              </AppText>
              {appointment.customer.phone ? (
                <AppText
                  color="textMuted"
                  style={styles.phone}
                  variant="bodySmall"
                >
                  {appointment.customer.phone}
                </AppText>
              ) : null}
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${status.color}18` },
              ]}
            >
              <View
                style={[styles.statusDot, { backgroundColor: status.color }]}
              />
              <AppText
                style={[styles.statusLabel, { color: status.color }]}
                variant="label"
              >
                {status.label}
              </AppText>
            </View>
            {canOpenCustomer ? (
              <SymbolView
                name={{
                  ios: "chevron.right",
                  android: "chevron_right",
                  web: "chevron_right",
                }}
                size={14}
                tintColor={colors.textMuted}
              />
            ) : null}
          </View>
        </AppCard>
      </Pressable>

      {appointment.noShowCase ? (
        <AppCard style={styles.noShowInfo}>
          <AppText variant="label">Gelinmedi kaydı</AppText>
          <AppText color="textMuted" variant="bodySmall">
            {appointment.noShowCase.status === "PENDING_DISPUTE"
              ? "Müşterinin 48 saatlik itiraz süresi açık. Bu sürede ceza uygulanmaz."
              : appointment.noShowCase.status === "UNDER_REVIEW"
                ? "Müşteri itiraz etti. Platform incelemesi bekleniyor."
                : appointment.noShowCase.status === "REVOKED"
                  ? "İtiraz kabul edildi; gelinmedi kaydı geri alındı."
                  : "Gelinmedi kaydı kesinleşti."}
          </AppText>
        </AppCard>
      ) : null}

      <AppText style={styles.sectionTitle} variant="heading">
        Randevu bilgileri
      </AppText>
      <AppCard style={styles.infoCard}>
        <DetailRow
          icon={{
            ios: "calendar",
            android: "calendar_month",
            web: "calendar_month",
          }}
          label="Tarih"
          value={date}
        />
        <DetailRow
          icon={{ ios: "clock", android: "schedule", web: "schedule" }}
          label="Saat"
          value={`${formatBusinessTime(appointment.startsAt, appointment.barbershop.timezone)}–${formatBusinessTime(appointment.endsAt, appointment.barbershop.timezone)}`}
        />
        <DetailRow
          icon={{ ios: "scissors", android: "content_cut", web: "content_cut" }}
          label="Hizmet"
          value={appointment.serviceNameSnapshot}
        />
        <DetailRow
          icon={{ ios: "person", android: "person", web: "person" }}
          label="Çalışan"
          value={barberName}
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
          value={formatTurkishPrice(appointment.priceSnapshot)}
        />
      </AppCard>

      {appointment.changeProposal ? (
        <AppCard style={styles.changeProposalCard}>
          <View style={styles.changeProposalHeading}>
            <SymbolView
              name={{
                ios: "clock.badge.questionmark",
                android: "pending_actions",
                web: "pending_actions",
              }}
              size={21}
              tintColor={colors.primary}
            />
            <View style={styles.changeProposalCopy}>
              <AppText variant="label">Müşteri yanıtı bekleniyor</AppText>
              <AppText
                color="textMuted"
                style={styles.changeProposalText}
                variant="bodySmall"
              >
                {formatProposalDate(
                  appointment.changeProposal.proposedStartsAt,
                )}{" "}
                · {appointment.changeProposal.proposedServiceName}
              </AppText>
              <AppText color="textMuted" variant="bodySmall">
                {
                  appointment.changeProposal.proposedBusinessMember.user
                    .firstName
                }{" "}
                {
                  appointment.changeProposal.proposedBusinessMember.user
                    .lastName
                }
              </AppText>
              <AppText
                color="textMuted"
                style={styles.changeProposalReason}
                variant="bodySmall"
              >
                Açıklama: {appointment.changeProposal.reason}
              </AppText>
            </View>
          </View>
          <AppButton
            disabled={isUpdating}
            onPress={onCancelChangeProposal}
            variant="secondary"
          >
            Teklifi Geri Çek
          </AppButton>
        </AppCard>
      ) : null}

      {appointment.cancellationReason ? (
        <AppCard style={styles.noteCard}>
          <SymbolView
            name={{ ios: "info.circle", android: "info", web: "info" }}
            size={19}
            tintColor={colors.danger}
          />
          <View style={styles.noteCopy}>
            <AppText variant="label">İptal nedeni</AppText>
            <AppText
              color="textMuted"
              style={styles.noteText}
              variant="bodySmall"
            >
              {appointment.cancellationReason}
            </AppText>
          </View>
        </AppCard>
      ) : null}

      {canComplete || canEditRecord ? (
        <View style={styles.recordAction}>
          <AppButton disabled={isUpdating} onPress={onOpenHaircutRecord}>
            {appointment.haircutRecord
              ? "Tıraş Kaydına Devam Et"
              : "Tıraşı Tamamla ve Not Ekle"}
          </AppButton>
        </View>
      ) : null}

      {appointment.haircutRecord ? (
        <BusinessHaircutResult
          accessToken={accessToken}
          appointment={appointment}
          isUpdating={isUpdating}
          onRequestPortfolio={onRequestPortfolio}
        />
      ) : null}

      {canManage ? (
        <View style={styles.actions}>
          {canReschedule ? (
            <AppButton disabled={isUpdating} onPress={onReschedule}>
              Yeniden Planla
            </AppButton>
          ) : null}
          {canMarkNoShow ? (
            <AppButton
              disabled={isUpdating}
              onPress={onNoShow}
              variant="secondary"
            >
              Gelmedi
            </AppButton>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={isUpdating}
            onPress={onCancel}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.pressed,
              isUpdating && styles.disabled,
            ]}
          >
            <AppText color="danger" variant="label">
              Randevuyu İptal Et
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

function BusinessHaircutResult({
  accessToken,
  appointment,
  isUpdating,
  onRequestPortfolio,
}: {
  accessToken: string;
  appointment: BusinessAppointmentDetail;
  isUpdating: boolean;
  onRequestPortfolio: (photoId: string) => void;
}) {
  const record = appointment.haircutRecord;
  if (!record) return null;

  return (
    <View>
      <AppText style={styles.sectionTitle} variant="heading">
        Tıraş sonucu
      </AppText>
      {record.styleName || record.notes ? (
        <AppCard style={styles.resultCard}>
          {record.styleName ? (
            <AppText variant="label">{record.styleName}</AppText>
          ) : null}
          {record.notes ? (
            <AppText
              color="textMuted"
              style={record.styleName && styles.resultNotes}
            >
              {record.notes}
            </AppText>
          ) : null}
        </AppCard>
      ) : null}
      {record.photos.length ? (
        <ScrollView
          contentContainerStyle={styles.resultPhotos}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {record.photos.map((photo, index) => {
            const approvedPortfolioUrl =
              photo.portfolioItem?.status === "APPROVED"
                ? `/portfolio/items/${photo.portfolioItem.id}/image`
                : null;
            const displayUrl = approvedPortfolioUrl ?? photo.url;

            return (
              <View key={photo.id} style={styles.portfolioPhotoCard}>
                {displayUrl ? (
                  <Image
                    accessibilityLabel={`Tıraş sonucu fotoğrafı ${index + 1}`}
                    contentFit="cover"
                    source={{
                      ...(photo.url
                        ? {
                            headers: { Authorization: `Bearer ${accessToken}` },
                          }
                        : {}),
                      uri: resolveApiUrl(displayUrl),
                    }}
                    style={styles.resultPhoto}
                  />
                ) : (
                  <View style={[styles.resultPhoto, styles.privatePhoto]}>
                    <SymbolView
                      name={{ ios: "lock.fill", android: "lock", web: "lock" }}
                      size={24}
                      tintColor={colors.textMuted}
                    />
                    <AppText
                      color="textMuted"
                      style={styles.privatePhotoText}
                      variant="bodySmall"
                    >
                      Fotoğraf müşterinin özel geçmişinde saklanıyor.
                    </AppText>
                  </View>
                )}
                {photo.portfolioItem?.status === "PENDING" ? (
                  <AppText
                    color="textMuted"
                    style={styles.portfolioStatus}
                    variant="bodySmall"
                  >
                    Müşteri onayı bekleniyor
                  </AppText>
                ) : photo.portfolioItem?.status === "APPROVED" ? (
                  <AppText
                    color="primary"
                    style={styles.portfolioStatus}
                    variant="bodySmall"
                  >
                    Portföyde yayında
                  </AppText>
                ) : (
                  <AppButton
                    disabled={isUpdating}
                    onPress={() => onRequestPortfolio(photo.id)}
                    variant="secondary"
                  >
                    Portföy İzni İste
                  </AppButton>
                )}
              </View>
            );
          })}
        </ScrollView>
      ) : null}
      {record.finalizedAt ? (
        <View style={styles.lockedRow}>
          <SymbolView
            name={{ ios: "lock.fill", android: "lock", web: "lock" }}
            size={15}
            tintColor={colors.textMuted}
          />
          <AppText color="textMuted" variant="bodySmall">
            Kayıt tamamlandı, yalnızca görüntülenebilir.
          </AppText>
        </View>
      ) : null}
    </View>
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
    <View style={[styles.detailRow, isLast && styles.lastDetailRow]}>
      <View style={styles.detailLabel}>
        <SymbolView name={icon} size={18} tintColor={colors.primary} />
        <AppText
          color="textMuted"
          style={styles.detailLabelText}
          variant="bodySmall"
        >
          {label}
        </AppText>
      </View>
      <AppText numberOfLines={2} style={styles.detailValue} variant="label">
        {value}
      </AppText>
    </View>
  );
}

function formatProposalDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
    weekday: "long",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  noShowInfo: { gap: spacing.xs, marginTop: spacing.md },
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  customerCard: { marginTop: spacing.md, padding: spacing.md },
  pressed: { opacity: 0.65 },
  customerTopRow: { alignItems: "center", flexDirection: "row" },
  avatar: { borderRadius: radius.pill, height: 62, width: 62 },
  avatarPlaceholder: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
  },
  initials: { fontSize: 20, lineHeight: 26 },
  customerCopy: { flex: 1, marginLeft: spacing.sm },
  customerName: { fontSize: 17, lineHeight: 23 },
  phone: { marginTop: 2 },
  statusBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    flexDirection: "row",
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusDot: { borderRadius: radius.pill, height: 6, width: 6 },
  statusLabel: { fontSize: 11, lineHeight: 15, marginLeft: 4 },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  infoCard: { paddingBottom: 0, paddingTop: 0 },
  detailRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 54,
  },
  lastDetailRow: { borderBottomWidth: 0 },
  detailLabel: { alignItems: "center", flexDirection: "row", width: 105 },
  detailLabelText: { marginLeft: spacing.xs },
  detailValue: { flex: 1, textAlign: "right" },
  noteCard: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.md,
  },
  noteCopy: { flex: 1, marginLeft: spacing.sm },
  noteText: { marginTop: 2 },
  recordAction: { marginTop: spacing.lg },
  resultCard: { padding: spacing.md },
  resultNotes: { lineHeight: 21, marginTop: spacing.xs },
  resultPhotos: {
    gap: spacing.sm,
    paddingRight: spacing.md,
    paddingTop: spacing.sm,
  },
  resultPhoto: { borderRadius: radius.card, height: 180, width: 250 },
  privatePhoto: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    justifyContent: "center",
    padding: spacing.lg,
  },
  privatePhotoText: { marginTop: spacing.xs, textAlign: "center" },
  portfolioPhotoCard: { gap: spacing.xs, width: 250 },
  portfolioStatus: { textAlign: "center" },
  lockedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  actions: { gap: spacing.xs, marginTop: spacing.lg },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  changeProposalCard: { gap: spacing.md, marginTop: spacing.md },
  changeProposalHeading: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
  },
  changeProposalCopy: { flex: 1 },
  changeProposalText: { lineHeight: 19, marginTop: spacing.xxs },
  changeProposalReason: { lineHeight: 18, marginTop: spacing.xs },
  disabled: { opacity: 0.45 },
});
