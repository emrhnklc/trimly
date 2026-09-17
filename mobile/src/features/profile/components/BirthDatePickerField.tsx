import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { birthDateInputToIso } from "@/features/profile/birth-date";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

const earliestBirthDate = new Date(1900, 0, 1);

export function BirthDatePickerField({
  label = "Doğum tarihi",
  onChange,
  optional = false,
  value,
}: {
  label?: string;
  onChange: (value: string) => void;
  optional?: boolean;
  value: string;
}) {
  const colors = useThemeColors();
  const [draftDate, setDraftDate] = useState(() => inputToDate(value));
  const [isVisible, setVisible] = useState(false);

  function open() {
    setDraftDate(inputToDate(value));
    setVisible(true);
  }

  function changeAndroidDate(event: DateTimePickerEvent, selected?: Date) {
    setVisible(false);
    if (event.type === "set" && selected) onChange(dateToInput(selected));
  }

  return (
    <View style={styles.field}>
      <AppText variant="label">
        {label}{optional ? " (isteğe bağlı)" : ""}
      </AppText>
      <Pressable
        accessibilityRole="button"
        onPress={open}
        style={({ pressed }) => [
          styles.input,
          { backgroundColor: colors.background, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{ ios: "calendar", android: "calendar_month", web: "calendar_month" }}
          size={18}
          tintColor={colors.textMuted}
        />
        <AppText color={value ? "text" : "textMuted"} style={styles.value}>
          {value || "GG.AA.YYYY"}
        </AppText>
        <SymbolView
          name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
          size={17}
          tintColor={colors.textMuted}
        />
      </Pressable>

      {Platform.OS === "android" && isVisible ? (
        <DateTimePicker
          maximumDate={new Date()}
          minimumDate={earliestBirthDate}
          mode="date"
          onChange={changeAndroidDate}
          value={draftDate}
        />
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={Platform.OS === "ios" && isVisible}
      >
        <Pressable onPress={() => setVisible(false)} style={styles.overlay}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.pickerCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText style={styles.title} variant="sectionTitle">{label}</AppText>
            <DateTimePicker
              display="spinner"
              locale="tr-TR"
              maximumDate={new Date()}
              minimumDate={earliestBirthDate}
              mode="date"
              onChange={(_, selected) => selected && setDraftDate(selected)}
              value={draftDate}
            />
            <View style={styles.actions}>
              <View style={styles.action}>
                <AppButton onPress={() => setVisible(false)} variant="secondary">
                  İptal
                </AppButton>
              </View>
              <View style={styles.action}>
                <AppButton
                  onPress={() => {
                    onChange(dateToInput(draftDate));
                    setVisible(false);
                  }}
                >
                  Tarihi Kullan
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function inputToDate(value: string) {
  const iso = birthDateInputToIso(value);
  if (!iso) return new Date(2000, 0, 1);
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateToInput(value: Date) {
  return [
    String(value.getDate()).padStart(2, "0"),
    String(value.getMonth() + 1).padStart(2, "0"),
    value.getFullYear(),
  ].join(".");
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs, marginTop: spacing.sm },
  input: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  value: { flex: 1, marginHorizontal: spacing.sm },
  pressed: { opacity: 0.68 },
  overlay: {
    backgroundColor: "rgba(12, 8, 5, 0.55)",
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  pickerCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
  },
  title: { textAlign: "center" },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
