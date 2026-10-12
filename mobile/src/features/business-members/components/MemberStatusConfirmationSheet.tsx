import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import type { MemberAppointmentImpact } from "@/features/members/types";
import { spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";
import { MemberAppointmentImpactCard } from "./MemberAppointmentImpactCard";

export function MemberStatusConfirmationSheet({
  impact,
  requiresResolution,
  isSaving,
  error,
  onConfirm,
  onDismiss,
  onOpen,
  onPropose,
}: {
  impact: MemberAppointmentImpact;
  requiresResolution: boolean;
  isSaving: boolean;
  error: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
  onOpen: (id: string) => void;
  onPropose: (id: string) => void;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal
      transparent
      animationType="slide"
      visible
      onRequestClose={() => {
        if (!isSaving) onDismiss();
      }}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <AppText variant="sectionTitle">
              {requiresResolution
                ? "Önce mevcut randevuları çöz"
                : "Yeni randevulara kapat"}
            </AppText>
            <AppText color="textMuted" variant="bodySmall">
              {requiresResolution
                ? "Mevcut randevular çözülmeden çalışan pasife alınamaz veya çırak yapılamaz. Şimdilik yalnız yeni randevu alımını kapatabilirsin; diğer değişiklikler kaydedilmez."
                : "Yeni rezervasyonlar durur. Mevcut randevular geçerliliğini korur; otomatik iptal edilmez veya başka berbere aktarılmaz."}
            </AppText>
            <MemberAppointmentImpactCard
              impact={impact}
              onOpen={onOpen}
              onPropose={onPropose}
            />
            {error ? (
              <AppText color="danger" variant="bodySmall">
                {error}
              </AppText>
            ) : null}
          </ScrollView>
          <View style={styles.buttons}>
            <AppButton disabled={isSaving} onPress={onConfirm}>
              {isSaving
                ? "Kaydediliyor…"
                : requiresResolution
                  ? "Yalnız Yeni Randevulara Kapat"
                  : "Onayla ve Kaydet"}
            </AppButton>
            <AppButton
              disabled={isSaving}
              variant="secondary"
              onPress={onDismiss}
            >
              Düzenlemeye Dön
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.lg,
  },
  content: { gap: spacing.md, paddingBottom: spacing.md },
  buttons: { gap: spacing.xs },
});
