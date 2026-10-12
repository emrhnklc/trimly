import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import type { MemberAppointmentImpact } from "@/features/members/types";
import { spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function MemberAppointmentImpactCard({
  impact,
  onOpen,
  onPropose,
}: {
  impact: MemberAppointmentImpact;
  onOpen: (id: string) => void;
  onPropose: (id: string) => void;
}) {
  const colors = useThemeColors();
  const [expanded, setExpanded] = useState(false);
  return (
    <AppCard style={styles.card}>
      <AppText variant="cardTitle">
        Çözülmesi gereken {impact.total} randevu
      </AppText>
      <AppText color="textMuted" variant="bodySmall">
        Önce alternatif berber veya saat teklif et. Müşteri kabul etmeden
        randevu aktarılmaz. Reddederse cezasız iptal edebilir. İşletme iptalinde
        mevcut güvenilirlik kuralları geçerlidir.
      </AppText>
      {impact.appointments
        .slice(0, expanded ? undefined : 5)
        .map((appointment) => {
          const canPropose =
            appointment.status === "CONFIRMED" &&
            new Date(appointment.startsAt) > new Date() &&
            !appointment.changeProposals.length;
          return (
            <View
              key={appointment.id}
              style={[styles.row, { borderTopColor: colors.border }]}
            >
              <AppText variant="label">
                {appointment.attendeeNameSnapshot}
              </AppText>
              <AppText color="textMuted" variant="bodySmall">
                {new Date(appointment.startsAt).toLocaleString("tr-TR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                · {appointment.serviceNameSnapshot}
              </AppText>
              {appointment.changeProposals.length ? (
                <AppText color="primary" variant="bodySmall">
                  Müşterinin teklif yanıtı bekleniyor
                </AppText>
              ) : null}
              {appointment.status === "ARRIVED" ? (
                <AppText color="primary" variant="bodySmall">
                  Başlayan hizmeti önce tamamlamalısın.
                </AppText>
              ) : null}
              <View style={styles.actions}>
                <View style={styles.action}>
                  <AppButton
                    variant="secondary"
                    onPress={() => onOpen(appointment.id)}
                  >
                    Detay
                  </AppButton>
                </View>
                {canPropose ? (
                  <View style={styles.action}>
                    <AppButton onPress={() => onPropose(appointment.id)}>
                      Teklif Et
                    </AppButton>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}
      {impact.appointments.length > 5 ? (
        <AppButton
          variant="ghost"
          onPress={() => setExpanded((value) => !value)}
        >
          {expanded ? "Daha Az Göster" : "Randevuları Göster"}
        </AppButton>
      ) : null}
      {impact.total > impact.appointments.length ? (
        <AppText color="textMuted" variant="bodySmall">
          İlk {impact.appointments.length} randevu gösteriliyor. İşlemler
          tamamlandıkça kalanlar listelenir.
        </AppText>
      ) : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { borderTopWidth: 1, paddingTop: spacing.sm, gap: spacing.xxs },
  actions: { flexDirection: "row", gap: spacing.xs, marginTop: spacing.xs },
  action: { flex: 1 },
});
