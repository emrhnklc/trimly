import { useState } from "react";
import { StyleSheet, TextInput } from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import type { CustomerAppointment } from "@/features/appointments/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function NoShowDisputeCard({
  appointment,
  isSubmitting,
  onSubmit,
}: {
  appointment: CustomerAppointment;
  isSubmitting: boolean;
  onSubmit: (reason: string) => void;
}) {
  const colors = useThemeColors();
  const [reason, setReason] = useState("");
  const record = appointment.noShowCase;
  if (!record) return null;

  const deadline = new Date(record.disputeDeadline);
  const canDispute =
    record.status === "PENDING_DISPUTE" && deadline > new Date();
  const deadlineLabel = new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(deadline);

  return (
    <AppCard style={styles.card}>
      <AppText variant="heading">Gelinmedi kaydı</AppText>
      {record.status === "PENDING_DISPUTE" ? (
        <>
          <AppText color="textMuted" style={styles.copy} variant="bodySmall">
            İşletme bu randevuyu gelinmedi olarak işaretledi.{" "}
            {canDispute
              ? `${deadlineLabel} tarihine kadar itiraz edebilirsin. Bu sürede ceza uygulanmaz.`
              : "İtiraz süresi sona erdi."}
          </AppText>
          {canDispute ? (
            <>
              <TextInput
                editable={!isSubmitting}
                maxLength={1000}
                multiline
                onChangeText={setReason}
                placeholder="Ne olduğunu kısaca anlat (en az 10 karakter)"
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                textAlignVertical="top"
                value={reason}
              />
              <AppButton
                disabled={reason.trim().length < 10 || isSubmitting}
                onPress={() => onSubmit(reason.trim())}
                variant="secondary"
              >
                {isSubmitting ? "Gönderiliyor…" : "Gelinmedi Kaydına İtiraz Et"}
              </AppButton>
            </>
          ) : null}
        </>
      ) : (
        <AppText color="textMuted" style={styles.copy} variant="bodySmall">
          {record.status === "UNDER_REVIEW"
            ? "İtirazın incelemede. Karar verilene kadar ceza uygulanmaz."
            : record.status === "REVOKED"
              ? "Gelinmedi kaydı geri alındı; bu kayıt ceza hesabına dahil değil."
              : "Gelinmedi kaydı kesinleşti."}
        </AppText>
      )}
      {record.disputeReason ? (
        <AppText color="textMuted" style={styles.reason} variant="bodySmall">
          İtirazın: {record.disputeReason}
        </AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, marginTop: spacing.md },
  copy: { lineHeight: 21 },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 96,
    padding: spacing.md,
  },
  reason: { marginTop: spacing.xs },
});
