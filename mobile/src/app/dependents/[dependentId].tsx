import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { SettingsPageHeader } from "@/components/ui/SettingsPageHeader";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  deleteDependent,
  getMyDependent,
  updateDependent,
} from "@/features/dependents/api";
import { DependentProfileForm } from "@/features/dependents/components/DependentProfileForm";
import type { DependentProfileInput } from "@/features/dependents/types";
import { spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export default function EditDependentScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { dependentId } = useLocalSearchParams<{ dependentId?: string }>();
  const { token } = useAuth();
  const [input, setInput] = useState<DependentProfileInput | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token || !dependentId) return;
      let active = true;
      void getMyDependent(dependentId, token)
        .then((dependent) => {
          if (!active) return;
          setInput({
            firstName: dependent.firstName,
            lastName: dependent.lastName,
            relationship: dependent.relationship,
            relationshipLabel: dependent.relationshipLabel ?? "",
            birthDate: dependent.birthDate.slice(0, 10),
            notes: dependent.notes ?? "",
          });
        })
        .catch(
          (reason) =>
            active &&
            setError(
              reason instanceof Error ? reason.message : "Yakın yüklenemedi.",
            ),
        );
      return () => {
        active = false;
      };
    }, [dependentId, token]),
  );

  async function submit() {
    if (!token || !dependentId || !input) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateDependent(dependentId, input, token);
      router.back();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Yakın güncellenemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDelete() {
    if (!token || !dependentId) return;
    Alert.alert(
      "Yakın profili kaldırılsın mı?",
      "Geçmiş randevular korunur. Aktif randevusu olan profil kaldırılamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Kaldır",
          style: "destructive",
          onPress: () =>
            void (async () => {
              setSubmitting(true);
              try {
                await deleteDependent(dependentId, token);
                router.back();
              } catch (reason) {
                setError(
                  reason instanceof Error
                    ? reason.message
                    : "Yakın kaldırılamadı.",
                );
              } finally {
                setSubmitting(false);
              }
            })(),
        },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <SettingsPageHeader title="Yakını Düzenle" />
      </View>
      {!input ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <>
          <DependentProfileForm
            error={error}
            footer={
              <View style={styles.deleteButton}>
                <Pressable
                  accessibilityRole="button"
                  disabled={isSubmitting}
                  onPress={confirmDelete}
                  style={({ pressed }) => [
                    styles.deleteAction,
                    { backgroundColor: colors.dangerSurface, borderColor: colors.danger },
                    pressed && styles.pressed,
                    isSubmitting && styles.disabled,
                  ]}
                >
                  <AppText color="danger" variant="label">Yakını Kaldır</AppText>
                </Pressable>
              </View>
            }
            input={input}
            isSubmitting={isSubmitting}
            onChange={setInput}
            onSubmit={() => void submit()}
            submitLabel="Değişiklikleri Kaydet"
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  deleteButton: { marginTop: spacing.lg },
  deleteAction: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.45 },
});
